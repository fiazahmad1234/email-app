import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx-js-style";

function MotusExtractor() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetProgress, setTargetProgress] = useState(0);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  const rafRef = useRef(null);
  const API = "https://data.transportation.gov/resource/az4n-8mr2.json";

  // Smoothly interpolate displayed progress toward targetProgress
  useEffect(() => {
    if (!loading && targetProgress === 0) {
      setProgress(0);
      return;
    }

    const tick = () => {
      setProgress((prev) => {
        if (Math.abs(targetProgress - prev) < 0.4) {
          return targetProgress;
        }
        const diff = targetProgress - prev;
        return prev + diff * 0.14;
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetProgress, loading]);

  const handleExtract = async () => {
    let dots = inputText
      .split(/[\s,;]+/)
      .map((x) => x.trim())
      .filter((x) => /^\d+$/.test(x));

    dots = [...new Set(dots)];

    if (!dots.length) {
      alert("Please enter valid DOT numbers.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setTargetProgress(18);
    setResults([]);
    setStatusMessage("Fetching records from official database...");

    try {
      const dotListString = dots.join(",");
      const queryUrl = `${API}?$where=dot_number in(${dotListString})&$select=dot_number,legal_name,phone,email_address,phy_street,phy_city,phy_state,phy_zip,status_code&$limit=500`;

      setTargetProgress(52);
      const res = await fetch(queryUrl);
      setTargetProgress(82);
      const data = await res.json();

      const recordMap = new Map();
      if (Array.isArray(data)) {
        data.forEach((rec) => {
          recordMap.set(String(rec.dot_number).trim(), rec);
        });
      }

      const extractedResults = dots.map((dot) => {
        const record = recordMap.get(dot);
        if (record) {
          const email = record.email_address
            ? String(record.email_address).toLowerCase().trim()
            : "";
          const address = [
            record.phy_street,
            record.phy_city,
            record.phy_state,
            record.phy_zip,
          ]
            .filter(Boolean)
            .join(", ");

          return {
            dot,
            legalName: record.legal_name || "N/A",
            email: email || "",
            phone: record.phone || "N/A",
            address: address || "N/A",
            status: email ? "Found" : "Email Not Listed",
          };
        } else {
          return {
            dot,
            legalName: "N/A",
            email: "",
            phone: "N/A",
            address: "N/A",
            status: "Not Found",
          };
        }
      });

      setTargetProgress(100);
      setResults(extractedResults);
      setStatusMessage(
        `Completed: ${extractedResults.filter((r) => r.email).length} Emails Found.`
      );
    } catch (error) {
      setStatusMessage("Error: " + error.message);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setTargetProgress(0);
      }, 350);
    }
  };

  const exportExcel = () => {
    if (!results.length) {
      alert("No data available to export.");
      return;
    }

    const excelData = results.map((r) => ({
      "DOT Number": r.dot,
      "Company Legal Name": r.legalName,
      "Email Address": r.email || "N/A",
      "Phone Number": r.phone,
      "Street Address": r.address,
      Status: r.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const redColumns = ["Company Legal Name", "Street Address"];
    const headers = Object.keys(excelData[0]);
    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;

        const headerName = headers[C];
        if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};

        if (R === 0) {
          worksheet[cellAddress].s = {
            fill: { fgColor: { rgb: "156b3e" } },
            font: { bold: true, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center" },
          };
        } else {
          if (redColumns.includes(headerName)) {
            worksheet[cellAddress].s = {
              fill: { fgColor: { rgb: "FEE2E2" } },
              font: { color: { rgb: "990000" }, bold: true },
              alignment: { horizontal: "left", vertical: "center" },
            };
          }
        }
      }
    }

    const colWidths = headers.map((header) => {
      if (header === "Email Address" || header === "Street Address")
        return { wch: 40 };
      if (header === "Company Legal Name") return { wch: 35 };
      return { wch: 20 };
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Motus Carrier Records");
    XLSX.writeFile(workbook, "fiaz-Motus.xlsx");
  };

  const foundCount = results.filter((r) => r.email).length;
  const notFoundCount = results.length - foundCount;
  const displayProgress = Math.round(progress);

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased flex flex-col justify-between">
      <section className="bg-gradient-to-br from-slate-950 via-[#0d3b22] to-[#156b3e] text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="inline-block bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              APP 3 • MOTUS CARRIER CHK — HTTPS://MOTUS.DOT.GOV/
            </span>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Verify Motus Carriers
              <span className="block text-emerald-300">in Seconds</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed">
              Fast-query official Motus database by USDOT numbers. Instantly
              extract verified emails, legal names, and contact records.
            </p>

            <div className="pt-1 flex flex-wrap gap-3">
              <a
                href="https://motus.dot.gov/customer/daily-fmcsa-publications"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#156b3e] hover:bg-emerald-50 font-bold text-sm shadow-md transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                MC Fetch
              </a>
            </div>

            <div className="pt-4 border-t border-white/15 grid grid-cols-2 gap-3 text-xs font-semibold text-emerald-100">
              <span className="flex items-center gap-1.5">⚡ Lightning Fast Fetch</span>
              <span className="flex items-center gap-1.5">🔄 Updated daily</span>
              <span className="flex items-center gap-1.5">💲 100% free</span>
              <span className="flex items-center gap-1.5">🛡️ Official Motus Data</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-widest text-emerald-300">
                  ENTER MOTUS DOT NUMBERS (ONE PER LINE, COMMA OR SPACE SEPARATED)
                </label>
                <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  Batch Ready
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={"6846840\n8422854\n4864674"}
                className="w-full min-h-[170px] sm:min-h-[195px] p-4 bg-slate-900/80 border border-white/20 rounded-2xl text-sm sm:text-base text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-400 font-mono transition"
              ></textarea>

              {loading && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-emerald-200">
                    <span>Fetching records from official database...</span>
                    <span>{displayProgress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-900/80 p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-150 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                <span className="text-xs text-emerald-100/80 font-medium">
                  Batch query enabled.
                </span>
                <button
                  onClick={handleExtract}
                  disabled={loading}
                  className="w-full sm:w-auto bg-white text-[#156b3e] hover:bg-emerald-50 font-extrabold px-8 py-3.5 rounded-xl transition text-sm cursor-pointer disabled:opacity-50 shrink-0 shadow-md"
                >
                  {loading ? "Fast Fetching..." : "Search Motus Records"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-slate-50 border-t border-slate-200/70 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          {results.length === 0 && !loading && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-2xs space-y-2">
              <p className="text-sm sm:text-base font-extrabold text-[#156b3e]">
                {statusMessage ||
                  "Get MC from the Motus, then enter above and get data like this."}
              </p>
              <p className="text-xs sm:text-sm text-slate-600">
                Use <b>MC Fetch</b> above to get numbers from Motus, paste DOT
                numbers in the box, and click <b>Search Motus Records</b>.
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm space-y-4 text-left">
              <div className="p-5 sm:p-6 border-b border-slate-200 font-bold text-slate-800 text-xs sm:text-sm bg-white flex flex-wrap gap-3 justify-between items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-extrabold">
                    Total Processed: {results.length}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#156b3e] font-extrabold">
                    Found: {foundCount}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-extrabold">
                    Missing: {notFoundCount}
                  </span>
                </div>
                <button
                  onClick={exportExcel}
                  className="bg-[#156b3e] hover:bg-[#115431] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-2xs"
                >
                  Download Excel (.xlsx)
                </button>
              </div>

              <div className="hidden sm:block overflow-x-auto w-full px-4 sm:px-6 pb-6">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                      <th className="p-4 font-black rounded-tl-xl">DOT Number</th>
                      <th className="p-4 font-black">Company Name</th>
                      <th className="p-4 font-black">Extracted Email</th>
                      <th className="p-4 font-black rounded-tr-xl">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {results.map((r, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-emerald-50/60 transition-colors"
                      >
                        <td className="p-4 font-mono font-bold text-slate-900">
                          {r.dot}
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {r.legalName}
                        </td>
                        <td className="p-4">
                          {r.email ? (
                            <a
                              href={`mailto:${r.email}`}
                              className="text-emerald-700 font-bold hover:underline"
                            >
                              {r.email}
                            </a>
                          ) : (
                            <span className="text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-md text-xs">
                              Not Listed
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-700">
                          {r.phone}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden divide-y divide-slate-200 px-4 pb-5">
                {results.map((r, idx) => (
                  <div key={idx} className="py-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        DOT: {r.dot}
                      </span>
                      <span className="font-mono text-xs text-slate-600">
                        {r.phone}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {r.legalName}
                    </h3>
                    <div>
                      {r.email ? (
                        <a
                          href={`mailto:${r.email}`}
                          className="text-emerald-700 font-bold text-xs break-all underline"
                        >
                          {r.email}
                        </a>
                      ) : (
                        <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md text-xs">
                          Email Not Listed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="text-center text-xs text-slate-500 py-6 bg-white border-t border-slate-200/80 mt-auto">
        © 2026 CarrierChk. All rights reserved.
      </footer>
    </div>
  );
}

export default MotusExtractor;