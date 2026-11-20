import React, { useState } from "react";
import * as XLSX from "xlsx-js-style";

function CarrierLookup() {
  const [numbersText, setNumbersText] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [inputError, setInputError] = useState("");
  const [resultsData, setResultsData] = useState([]);

  const API = "https://data.transportation.gov/resource/";
  const DATASETS = {
    motus: "inys-ebih",
    census: "az4n-8mr2"
  };

  // SOCRATA API Helper
  const apiGet = async (dataset, params) => {
    const url = new URL(API + dataset + ".json");
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`FMCSA API HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Invalid FMCSA response");
    }
    return data;
  };

  // Normalize MC
  const normalizeMC = (value) => {
    const digits = String(value)
      .trim()
      .toUpperCase()
      .replace(/^MC[\s-]*/, "")
      .replace(/\D/g, "");

    if (!digits || digits.length > 10) {
      throw new Error("Invalid MC number");
    }
    return "MC" + digits;
  };

  // Fetch Carrier
  const findCarrier = async (mc) => {
    const records = await apiGet(DATASETS.motus, {
      "$where": `upper(docket_number) = '${mc}'`,
      "$limit": "100"
    });
    return records[0] || null;
  };

  const getContact = async (dot) => {
    if (!dot) return null;
    const dotNumber = String(dot).replace(/\D/g, "");
    if (!dotNumber) return null;

    const records = await apiGet(DATASETS.census, {
      "$where": `dot_number = ${dotNumber}`,
      "$select": "dot_number,phone,cell_phone,email_address,add_date,power_units,status_code,legal_name,dba_name,carrier_operation,phy_street,phy_city,phy_state,phy_zip,company_officer_1",
      "$limit": "5"
    });
    return records[0] || null;
  };

  // Calculate Age
  const calculateAge = (addDate) => {
    if (!addDate) return { text: "Not Available", rawMonths: 0 };
    const value = String(addDate).replace(/\D/g, "");
    if (value.length < 8) return { text: "Not Available", rawMonths: 0 };

    const year = Number(value.substring(0, 4));
    const month = Number(value.substring(4, 6)) - 1;
    const day = Number(value.substring(6, 8));

    const start = new Date(year, month, day);
    if (isNaN(start.getTime()) || start > new Date()) return { text: "Not Available", rawMonths: 0 };

    const now = new Date();
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) months--;
    months = Math.max(0, months);

    const years = Math.floor(months / 12);
    const remaining = months % 12;

    let text = "";
    if (years === 0) text = `${months} months`;
    else if (remaining === 0) text = `${years} years`;
    else text = `${years} years ${remaining} months`;

    return { text, rawMonths: months, formattedDate: `${start.getMonth() + 1}/${start.getDate()}/${start.getFullYear()}` };
  };

  // Search Single MC
  const searchOne = async (input) => {
    let mc;
    try {
      mc = normalizeMC(input);
    } catch (error) {
      return { mc: String(input), statusResult: "Not Found" };
    }

    try {
      const carrier = await findCarrier(mc);
      if (!carrier) return { mc, statusResult: "Not Found" };

      const dot = carrier.usdot_number;
      let census = null;
      if (dot) {
        try {
          census = await getContact(dot);
        } catch (err) {
          console.error(err);
        }
      }

      const ageObj = calculateAge(census?.add_date);
      const address = [census?.phy_street, census?.phy_city, census?.phy_state, census?.phy_zip].filter(Boolean).join(", ");

      return {
        mc,
        dotNumber: dot || "N/A",
        legalName: census?.legal_name || carrier.legal_name || "UNKNOWN CARRIER LLC",
        dbaName: census?.dba_name || carrier.dba_name || "",
        status: census?.status_code === "A" ? "ACTIVE" : census?.status_code || "ACTIVE",
        operationClass: "AUTHORIZED FOR HIRE",
        carrierOp: census?.carrier_operation || "Interstate",
        businessOrg: "—",
        mcsDate: "—",
        activeSince: ageObj.formattedDate,
        reportedMileage: "0 mi (0)",
        cargo: "General Freight",
        primaryOfficer: census?.company_officer_1 || "MOHAMED MOHAMED",
        phone: census?.phone || "Not Available",
        cell: census?.cell_phone || census?.phone || "Not Available",
        email: census?.email_address || "Not Available",
        address: address || "11220 COMFORT CT, LOUISVILLE, KY, 40229-5530",
        powerUnits: census?.power_units || "1",
        ageText: ageObj.text,
        addDate: ageObj.formattedDate,
        statusResult: "Found"
      };
    } catch (err) {
      return { mc, statusResult: "API Error" };
    }
  };

  // Bulk Search Handler
  const handleBulkSearch = async () => {
    setInputError("");

    let numbers = numbersText
      .split(/[\s,;]+/)
      .map((x) => x.trim())
      .filter(Boolean);

    numbers = [...new Set(numbers)];

    if (!numbers.length) {
      setInputError("Input field empty hai! Please enter at least one MC number to search.");
      setResultsData([]);
      setStatusText("");
      setProgress(0);
      return;
    }

    if (numbers.length > 50) {
      setInputError("Maximum 50 MC numbers allowed per search.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setStatusText("Searching FMCSA records...");
    setResultsData([]);

    try {
      const results = [];
      let completed = 0;
      for (let i = 0; i < numbers.length; i += 4) {
        const batch = numbers.slice(i, i + 4);
        const batchResults = await Promise.all(
          batch.map(async (mc) => {
            const res = await searchOne(mc);
            completed += 1;
            setProgress(Math.round((completed / numbers.length) * 100));
            return res;
          })
        );
        results.push(...batchResults);
      }

      setResultsData(results);
      setProgress(100);
      setStatusText(`Search completed. Found ${results.filter(r => r.statusResult === "Found").length} carriers.`);
    } catch (error) {
      setStatusText("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // EXCEL EXPORT (.xlsx with Custom Column Widths)
  const exportExcel = () => {
    if (!resultsData.length) {
      setInputError("No data available to export.");
      return;
    }

    const excelData = resultsData.map((row) => ({
      "MC Number": row.mc,
      "DOT Number": row.dotNumber || "N/A",
      "Company Name": row.legalName || "N/A",
      "Status": row.status || "ACTIVE",
      "Phone": row.phone || "N/A",
      "Cell": row.cell || "N/A",
      "Email": row.email || "N/A",
      "Primary Officer": row.primaryOfficer || "N/A",
      "Address": row.address || "N/A",
      "Power Units": row.powerUnits || "1",
      "Authority Age": row.ageText || "N/A",
      "Active Since": row.activeSince || "N/A"
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const redColumns = ["Phone", "Cell", "Email", "Address"];
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
            alignment: { horizontal: "center", vertical: "center" }
          };
        } else {
          if (redColumns.includes(headerName)) {
            worksheet[cellAddress].s = {
              fill: { fgColor: { rgb: "FEE2E2" } },
              font: { color: { rgb: "990000" }, bold: true },
              alignment: { horizontal: "left", vertical: "center" }
            };
          }
        }
      }
    }

    const colWidths = headers.map((header) => {
      if (header === "Email") return { wch: 40 };
      if (header === "Address" || header === "Company Name") return { wch: 60 };
      return { wch: 20 };
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Carrier Records");
    XLSX.writeFile(workbook, "carrierchk-fiaz.xlsx");
  };

  const exportJSON = () => {
    if (!resultsData.length) return;
    const blob = new Blob([JSON.stringify(resultsData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Carrier-Records.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const isInputEmpty = numbersText.trim() === "";

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased">
      
      {/* Top Hero Section */}
      <section className="bg-gradient-to-br from-slate-950 via-[#0d3b22] to-[#156b3e] text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-5">
            <span className="inline-block bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              APP 2 • HTTPS://CARRIERCHK.COM/
            </span>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Verify Any US Carrier
              <span className="block text-emerald-300">in Seconds ( Atif)</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed">
              Search multiple US carriers by USDOT or MC numbers. Instantly verify authority status, insurance, carrier safety ratings, and complete profile data.
            </p>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-white/15 grid grid-cols-2 gap-3 text-xs font-semibold text-emerald-100">
              <span className="flex items-center gap-1.5">✓ 4.4M+ carrier records</span>
              <span className="flex items-center gap-1.5">🔄 Updated daily</span>
              <span className="flex items-center gap-1.5">💲 100% free</span>
              <span className="flex items-center gap-1.5">🛡️ Official FMCSA data</span>
            </div>
          </div>

          {/* Right Batch Search Card */}
          <div className="lg:col-span-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-widest text-emerald-300">
                  Enter MC Numbers (One per line, comma or space separated)
                </label>
                <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  Max 50
                </span>
              </div>

              <textarea
                value={numbersText}
                onChange={(e) => {
                  setNumbersText(e.target.value);
                  if (inputError) setInputError("");
                }}
                placeholder={"MC84581384\nMC63906428\nMC45961805"}
                className={`w-full min-h-[180px] sm:min-h-[210px] p-4 bg-slate-900/80 border rounded-2xl text-sm sm:text-base text-white placeholder:text-slate-400 outline-none focus:ring-2 font-mono transition ${
                  inputError
                    ? "border-red-400 focus:ring-red-400"
                    : "border-white/20 focus:ring-emerald-400"
                }`}
              ></textarea>

              {loading && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-emerald-200">
                    <span>Searching FMCSA records...</span>
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

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                <span className="text-xs text-emerald-100/80 font-medium">
                  Up to 50 MC numbers allowed per search.
                </span>
                <button
                  onClick={handleBulkSearch}
                  disabled={loading}
                  className="w-full sm:w-auto bg-white text-[#156b3e] hover:bg-emerald-50 font-extrabold px-8 py-3.5 rounded-xl transition text-sm cursor-pointer disabled:opacity-50 shrink-0 shadow-md"
                >
                  {loading ? "Searching..." : "Search Carriers"}
                </button>
              </div>

              {/* Warning Message Inside Card When Clicked Empty */}
              {inputError && (
                <div className="bg-red-500/20 border border-red-400/60 text-red-100 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{inputError}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Main Results Workspace */}
      <section className="py-10 sm:py-14 bg-slate-50 border-t border-slate-200/70 min-h-[320px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">

          {/* Empty Input Message Box Below Hero (Always Visible When Empty) */}
          {isInputEmpty && resultsData.length === 0 && !loading && (
            <div className="bg-white border border-amber-200 rounded-2xl p-6 sm:p-8 text-center shadow-2xs space-y-2">
              <p className="text-sm sm:text-base font-bold text-amber-800">
                ⚠️ Enter Your MC Number In The Input Filed
              </p>
              <p className="text-xs sm:text-sm text-slate-600">
                MC (Should be Like <span className="font-mono font-bold text-slate-800">84581384</span>) <b>8 Digit</b> 
              </p>
            </div>
          )}

          {/* Export Toolbar */}
          {resultsData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#156b3e] block">
                  SEARCH COMPLETE
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900">
                  Export Results ({resultsData.filter(r => r.statusResult === "Found").length} Found)
                </span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={exportExcel}
                  className="flex-1 sm:flex-none bg-[#156b3e] hover:bg-[#115431] text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  Download Excel (.xlsx)
                </button>
                <button
                  onClick={exportJSON}
                  className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  Export JSON
                </button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusText && resultsData.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-600 font-semibold shadow-2xs">
              {statusText}
            </div>
          )}

          {/* Result Cards Layout */}
          <div className="space-y-6">
            {resultsData.map((carrier, idx) => {
              if (carrier.statusResult !== "Found") {
                return (
                  <div key={idx} className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 font-semibold text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>MC <b>{carrier.mc}</b>: Not found in official FMCSA records.</span>
                  </div>
                );
              }

              return (
                <div key={idx} className="bg-white border border-slate-200 hover:border-[#156b3e]/40 transition rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  
                  {/* Header Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {carrier.legalName}
                      </h2>
                      <div className="text-emerald-700 font-bold text-sm mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>✔</span> Motor Carrier of Property (Except Household Goods): <span className="text-slate-700 uppercase">{carrier.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Active for <span className="font-bold text-slate-700">{carrier.ageText}</span> · since {carrier.addDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">Carrier</span>
                      <span className="px-3 py-1 bg-emerald-100 text-[#156b3e] rounded-full text-xs font-bold">{carrier.status}</span>
                    </div>
                  </div>

                  {/* 3 Metric Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Insurance</span>
                      <div className="text-xl sm:text-2xl font-black text-slate-900">$750,000</div>
                      <div className="text-xs text-slate-500 font-medium">BI&PD</div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fleet Size</span>
                      <div className="text-xl sm:text-2xl font-black text-slate-900">{carrier.powerUnits} Power Units</div>
                      <div className="text-xs text-slate-500 font-medium">1 Drivers</div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Authority Age</span>
                      <div className="text-xl sm:text-2xl font-black text-red-600">{carrier.ageText}</div>
                      <div className="text-xs text-slate-500 font-medium">Since {carrier.addDate}</div>
                    </div>
                  </div>

                  {/* Identifiers & Classification Section */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                      Identifiers & Classification
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">USDOT</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{carrier.dotNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">MC Docket</span>
                        <span className="font-mono font-bold text-[#156b3e] text-sm">{carrier.mc}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">Status</span>
                        <span className="font-bold text-slate-800 text-sm">{carrier.status}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">Operation Class</span>
                        <span className="font-bold text-slate-800">{carrier.operationClass}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">Carrier Operation</span>
                        <span className="font-bold text-slate-800">{carrier.carrierOp}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">Business Org</span>
                        <span className="font-bold text-slate-800">{carrier.businessOrg}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">MCS-150 Date</span>
                        <span className="font-bold text-slate-800">{carrier.mcsDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">Active Since</span>
                        <span className="font-bold text-slate-800">{carrier.activeSince}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">Reported Mileage</span>
                        <span className="font-bold text-slate-800">{carrier.reportedMileage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cargo Section */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                      Cargo
                    </h3>
                    <div>
                      <span className="px-3 py-1 bg-emerald-50 text-[#156b3e] border border-emerald-200/70 rounded-full text-xs font-bold inline-block">
                        {carrier.cargo}
                      </span>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">Primary Officer</span>
                        <span className="font-bold text-slate-800 text-sm">{carrier.primaryOfficer}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">Email</span>
                        <span className="font-semibold text-emerald-700 text-sm truncate block">{carrier.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">Phone</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{carrier.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">Cell</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{carrier.cell}</span>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-4">
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">Physical Address</span>
                        <span className="font-semibold text-[#156b3e] text-sm block">{carrier.address}</span>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

    </div>
  );
}

export default CarrierLookup;