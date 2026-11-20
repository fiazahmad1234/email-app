import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx-js-style";
import { getCurrentUser } from "../utils/auth";

const MOTUS_API = "https://data.transportation.gov/resource/inys-ebih.json";
const LI_CARRIER_API = "https://data.transportation.gov/resource/6eyk-hxee.json";
const CENSUS_API = "https://data.transportation.gov/resource/az4n-8mr2.json";

const POOL_SIZE = 4;

const emptyCarrier = (mc) => ({
  mc: `MC${mc}`,
  dot: "",
  name: "",
  location: "",
  mcs150Date: "",
  dotStatus: "",
  phone: "",
  powerUnits: "",
  drivers: "",
  email: "",
  found: false,
});

const cleanValue = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return String(value).replace(/\s+/g, " ").trim();
};

const getValue = (obj, keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return cleanValue(value);
    }
  }
  return "";
};

const statusLabel = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "A") return "Active";
  if (value === "I") return "Inactive";
  if (value === "P") return "Pending";
  return cleanValue(status);
};

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const stripLeadingZeros = (digits) => {
  const cleaned = String(digits || "").replace(/^0+/, "");
  return cleaned || "0";
};

const formatUnitsDrivers = (units, drivers) => {
  const u = units || "0";
  const d = drivers || "0";
  return `Units: ${u} | Drivers: ${d}`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runPool(items, concurrency, handler) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const idx = cursor++;
      try {
        results[idx] = await handler(items[idx], idx);
      } catch (err) {
        results[idx] = { error: err };
      }
      await sleep(100);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

function Fmsc() {
  const [startMC, setStartMC] = useState("");
  const [endMC, setEndMC] = useState("");
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const syncAuth = () => setCurrentUser(getCurrentUser());
    window.addEventListener("carrierchk-auth-change", syncAuth);
    return () => window.removeEventListener("carrierchk-auth-change", syncAuth);
  }, []);

  const role = currentUser?.role || "user";

  const apiFetch = async (baseUrl, params) => {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `FMCSA API error ${response.status}: ${body.slice(0, 200)}`
      );
    }

    return response.json();
  };

  const buildDocketVariants = (mc) => {
    const digits = onlyDigits(mc);
    const noZero = stripLeadingZeros(digits);

    return [
      ...new Set([
        `MC${digits}`,
        `MC${noZero}`,
        `MC-${digits}`,
        `MC-${noZero}`,
        `MC ${digits}`,
        `MC ${noZero}`,
        `MC${digits.padStart(6, "0")}`,
        `MC${noZero.padStart(6, "0")}`,
        `MC${digits.padStart(7, "0")}`,
        `MC${noZero.padStart(7, "0")}`,
        `MC${digits.padStart(8, "0")}`,
        `MC${noZero.padStart(8, "0")}`,
        `MC${digits.padStart(10, "0")}`,
        `MC${noZero.padStart(10, "0")}`,
      ]),
    ];
  };

  const matchRecordToMc = (record, mc) => {
    const targetDigits = stripLeadingZeros(onlyDigits(mc));
    const docketRaw = getValue(record, [
      "docket_number",
      "mc_mx_number",
      "docket",
    ]);
    const docketDigits = stripLeadingZeros(onlyDigits(docketRaw));
    return Boolean(docketDigits && docketDigits === targetDigits);
  };

  const queryDocketDataset = async (apiUrl, mc) => {
    const variants = buildDocketVariants(mc);
    const docketList = variants.map((v) => `'${v.replace(/'/g, "''")}'`).join(",");
    if (!docketList) return [];

    try {
      const rows = await apiFetch(apiUrl, {
        $where: `docket_number in (${docketList})`,
        $limit: "50",
      });
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  };

  const fetchCensusByDot = async (dot) => {
    const cleanDot = onlyDigits(dot);
    const normDot = stripLeadingZeros(cleanDot);
    if (!cleanDot) return [];

    const dots = [...new Set([cleanDot, normDot].filter(Boolean))];
    const quoted = dots.map((d) => `'${d}'`).join(",");
    const raw = dots.join(",");

    try {
      const rows = await apiFetch(CENSUS_API, {
        $where: `(dot_number in (${raw}) OR dot_number in (${quoted}))`,
        $limit: "20",
      });
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  };

  const handleFetch = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");
    setCarriers([]);
    setProgress(0);

    const start = Number(startMC);
    const end = Number(endMC);

    if (
      !startMC ||
      !endMC ||
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 1 ||
      end < 1
    ) {
      setErrorMsg("Enter valid First MC and Last MC numbers.");
      return;
    }

    if (end < start) {
      setErrorMsg("Last MC must be greater than or equal to First MC.");
      return;
    }

    const total = end - start + 1;
    const mcNumbers = Array.from({ length: total }, (_, index) => start + index);

    setLoading(true);
    setStatusMsg(
      `Step 1: Resolving ${mcNumbers.length} MC numbers via React pool...`
    );

    try {
      let completedStep1 = 0;
      const docketMetaByMC = new Map();

      await runPool(mcNumbers, POOL_SIZE, async (mc) => {
        try {
          const [motusRows, liRows] = await Promise.all([
            queryDocketDataset(MOTUS_API, mc),
            queryDocketDataset(LI_CARRIER_API, mc),
          ]);

          const combined = [...motusRows, ...liRows].filter((r) =>
            matchRecordToMc(r, mc)
          );

          const best =
            combined.find((r) =>
              Boolean(onlyDigits(getValue(r, ["usdot_number", "dot_number"])))
            ) || combined[0];

          if (best) {
            const dot = onlyDigits(
              getValue(best, ["usdot_number", "dot_number"])
            );
            docketMetaByMC.set(mc, { dot });
          }
        } finally {
          completedStep1 += 1;
          setProgress(Math.min(50, Math.round((completedStep1 / total) * 50)));
        }
      });

      const dotNumbers = [
        ...new Set(
          [...docketMetaByMC.values()]
            .map((entry) => onlyDigits(entry.dot))
            .filter(Boolean)
        ),
      ];

      setStatusMsg(
        `Step 2: Fetching company details & emails for ${dotNumbers.length} USDOT numbers via React pool...`
      );

      let completedStep2 = 0;
      const censusByDOT = new Map();

      if (dotNumbers.length > 0) {
        await runPool(dotNumbers, POOL_SIZE, async (dot) => {
          try {
            const rows = await fetchCensusByDot(dot);
            if (rows.length > 0) {
              const rec = rows[0];
              const dDigits = onlyDigits(getValue(rec, ["dot_number"])) || dot;
              censusByDOT.set(dDigits, rec);
              censusByDOT.set(stripLeadingZeros(dDigits), rec);
            }
          } finally {
            completedStep2 += 1;
            setProgress(
              50 +
                Math.min(50, Math.round((completedStep2 / dotNumbers.length) * 50))
            );
          }
        });
      }

      const results = mcNumbers.map((mc) => {
        const meta = docketMetaByMC.get(mc);

        if (!meta) {
          return emptyCarrier(mc);
        }

        const cleanDot = onlyDigits(meta.dot);
        const normalizedDot = stripLeadingZeros(cleanDot);

        if (!cleanDot) {
          return emptyCarrier(mc);
        }

        const census =
          censusByDOT.get(cleanDot) || censusByDOT.get(normalizedDot);

        if (!census) {
          return {
            ...emptyCarrier(mc),
            dot: cleanDot,
            found: true,
          };
        }

        const street = getValue(census, ["phy_street"]);
        const city = getValue(census, ["phy_city"]);
        const state = getValue(census, ["phy_state"]);
        const zip = getValue(census, ["phy_zip"]);

        const location = [street, city, state, zip].filter(Boolean).join(", ");

        return {
          mc: `MC${mc}`,
          dot: cleanDot,
          name: getValue(census, ["legal_name", "dba_name"]),
          location,
          mcs150Date: getValue(census, ["mcs150_date"]),
          dotStatus: statusLabel(getValue(census, ["status_code"])),
          phone: getValue(census, ["phone"]),
          powerUnits: getValue(census, ["power_units", "nbr_power_unit"]),
          drivers: getValue(census, ["total_drivers"]),
          email: getValue(census, ["email_address"]),
          found: true,
        };
      });

      setCarriers(results);
      setProgress(100);

      const found = results.filter((item) => item.found).length;
      const emails = results.filter((item) => item.email).length;

      setStatusMsg(
        `Completed: ${found} carriers found out of ${results.length} checked, ${emails} emails available.`
      );
    } catch (err) {
      console.error("FMCSA fetch error:", err);
      setErrorMsg(
        err.message ||
          "FMCSA data could not be fetched. Check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!carriers.length) {
      setErrorMsg("No records available to export.");
      return;
    }

    const rows = carriers.map((item) => ({
      MC: item.mc,
      USDOT: item.dot,
      "Company Name": item.name,
      Address: item.location,
      "MCS-150 Date": item.mcs150Date,
      "DOT Status": item.dotStatus,
      Phone: item.phone,
      "Units & Drivers": formatUnitsDrivers(item.powerUnits, item.drivers),
      Email: item.email,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 16 },
      { wch: 32 },
      { wch: 42 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 28 },
      { wch: 35 },
    ];

    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];

      if (cell) {
        cell.s = {
          font: {
            bold: true,
            color: { rgb: "FFFFFF" },
          },
          fill: {
            fgColor: { rgb: "166534" },
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
          },
        };
      }
    }

    worksheet["!rows"] = [{ hpt: 25 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FMCSA Carriers");
    XLSX.writeFile(workbook, "fiaz-fmsc.xlsx");
  };

  const exportEmails = () => {
    const rows = carriers
      .filter((item) => item.email)
      .map((item) => ({
        "Company Name": item.name,
        MC: item.mc,
        USDOT: item.dot,
        Email: item.email,
        Phone: item.phone,
      }));

    if (!rows.length) {
      setErrorMsg("No email addresses available to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 32 },
      { wch: 16 },
      { wch: 16 },
      { wch: 38 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Carrier Emails");
    XLSX.writeFile(workbook, "fmcsa_emails.xlsx");
  };

  const foundCount = carriers.filter((item) => item.found).length;
  const missingCount = carriers.length - foundCount;
  const emailCount = carriers.filter((item) => item.email).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col justify-between">
      <section className="bg-gradient-to-br from-slate-950 via-[#0d3b22] to-[#156b3e] text-white py-8 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-6 space-y-3 sm:space-y-4 text-center lg:text-left">
            <span className="inline-block bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              CUSTOM RANGE • NO DAILY LIMIT
            </span>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              FMSC Lookup
              <span className="block text-emerald-300">React Pool Engine</span>
            </h1>

            <p className="text-xs sm:text-base text-slate-200 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Enter any custom First and Last MC range with no daily fetch limit using a React worker pool across FMCSA open datasets.
            </p>

            <div className="pt-2.5 border-t border-white/15 text-[11px] sm:text-xs font-bold text-emerald-100 flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3">
              <span>Role: {role.toUpperCase()}</span>
              <span>•</span>
              <span>Daily Limit: NONE</span>
              <span>•</span>
              <span>Range: CUSTOM</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <form
              onSubmit={handleFetch}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl space-y-3.5 sm:space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-emerald-300">
                  ENTER FIRST & LAST MC
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  No Limit
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-100 mb-1">
                    First MC Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={startMC}
                    onChange={(e) => setStartMC(e.target.value)}
                    placeholder="Enter First MC"
                    required
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-900/80 border border-white/20 rounded-xl text-sm text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-100 mb-1">
                    Last MC Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={endMC}
                    onChange={(e) => setEndMC(e.target.value)}
                    placeholder="Enter Last MC"
                    required
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-900/80 border border-white/20 rounded-xl text-sm text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-500/20 border border-red-400/60 text-red-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {loading && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-emerald-200 gap-2">
                    <span className="truncate">
                      {statusMsg || "Fetching via React pool..."}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-900/80">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <span className="text-xs text-emerald-100/80 text-center sm:text-left">
                  Enter first and last MC to fetch records.
                </span>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-white text-[#156b3e] hover:bg-emerald-50 font-extrabold px-7 py-3 sm:px-8 sm:py-3.5 rounded-xl text-sm cursor-pointer disabled:opacity-50 shadow-md transition"
                >
                  {loading ? "Fetching Records..." : "Fetch FMSC Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-12 flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">
          {carriers.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-extrabold">
                  <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-full">
                    Total Processed: {carriers.length}
                  </span>
                  <span className="bg-emerald-50 text-[#156b3e] px-3 py-1.5 rounded-full">
                    Found: {foundCount}
                  </span>
                  <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full">
                    Missing: {missingCount}
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                    Emails: {emailCount}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={exportExcel}
                    className="flex-1 sm:flex-none bg-[#156b3e] hover:bg-[#115431] text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition shadow-2xs"
                  >
                    Download Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={exportEmails}
                    disabled={!emailCount}
                    className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition"
                  >
                    Export Emails
                  </button>
                </div>
              </div>

              {/* Mobile / Phone Responsive Cards */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {carriers.map((item, idx) => (
                  <div
                    key={`card-${item.mc}-${idx}`}
                    className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                      <span className="font-mono font-black text-xs text-[#156b3e]">
                        {item.mc}
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-800">
                        DOT: {item.dot || "—"}
                      </span>
                      <span className="text-[11px] font-bold uppercase text-slate-600">
                        {item.dotStatus || "—"}
                      </span>
                    </div>

                    <p className="font-extrabold text-sm text-slate-900 leading-snug">
                      {item.name || "No record found"}
                    </p>

                    {item.location && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.location}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-700">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Phone
                        </span>
                        <span className="font-mono font-semibold">
                          {item.phone || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          MCS-150 Date
                        </span>
                        <span className="font-mono font-semibold">
                          {item.mcs150Date || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 text-xs font-semibold text-slate-800">
                      {formatUnitsDrivers(item.powerUnits, item.drivers)}
                    </div>

                    <div className="pt-1 text-xs">
                      {item.email ? (
                        <a
                          href={`mailto:${item.email}`}
                          className="text-[#156b3e] font-bold hover:underline break-all"
                        >
                          {item.email}
                        </a>
                      ) : (
                        <span className="text-slate-400 font-medium">
                          Email: Not Found
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop / Tablet Table */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/70">
                <table className="w-full text-left border-collapse min-w-[1050px]">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-600 text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-black">MC</th>
                      <th className="py-3.5 px-4 font-black">USDOT</th>
                      <th className="py-3.5 px-4 font-black">Company Name</th>
                      <th className="py-3.5 px-4 font-black">Address</th>
                      <th className="py-3.5 px-4 font-black">MCS-150 Date</th>
                      <th className="py-3.5 px-4 font-black">DOT Status</th>
                      <th className="py-3.5 px-4 font-black">Phone</th>
                      <th className="py-3.5 px-4 font-black">Units & Drivers</th>
                      <th className="py-3.5 px-4 font-black">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {carriers.map((item, idx) => (
                      <tr
                        key={`${item.mc}-${idx}`}
                        className="hover:bg-emerald-50/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-[#156b3e]">
                          {item.mc}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {item.dot || "—"}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {item.name || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {item.location || "—"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {item.mcs150Date || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold uppercase text-slate-700">
                          {item.dotStatus || "—"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {item.phone || "—"}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {formatUnitsDrivers(item.powerUnits, item.drivers)}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.email ? (
                            <a
                              href={`mailto:${item.email}`}
                              className="text-[#156b3e] font-bold hover:underline break-all"
                            >
                              {item.email}
                            </a>
                          ) : (
                            <span className="text-slate-400 font-medium text-xs">
                              Not Found
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {carriers.length === 0 && !loading && (
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center shadow-2xs space-y-2">
              <p className="text-base sm:text-lg font-extrabold text-[#156b3e]">
                {statusMsg ||
                  "Enter first and last MC above to fetch carrier records."}
              </p>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Provide any custom First MC Number and Last MC Number and click
                Fetch FMSC Data.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Fmsc;