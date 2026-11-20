import React, { useState } from "react";
import * as XLSX from "xlsx-js-style"; // <-- Yahan 'xlsx' ki jagah 'xlsx-js-style' import karna hai

function Mcnumber() {
  const [selectedDate, setSelectedDate] = useState("2026-11-17");
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [onlyWithEmail, setOnlyWithEmail] = useState(false);

  // Convert YYYY-MM-DD to YYYYMMDD for FMCSA API
  const formatDateForApi = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.replace(/-/g, "");
  };

  // Fetch FMCSA Company Census Data
  const fetchCarriers = async () => {
    setLoading(true);
    setError("");
    setCarriers([]);

    const apiDate = formatDateForApi(selectedDate);

    try {
      const allRecords = [];
      const limit = 50000;

      const params = new URLSearchParams({
        "$order": "dot_number DESC",
        "$limit": String(limit),
      });

      if (apiDate) {
        params.set("$where", `add_date='${apiDate}'`);
      }

      const url = `https://data.transportation.gov/resource/az4n-8mr2.json?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`FMCSA API Server Error: ${response.status}`);
      }

      const rawData = await response.json();

      if (!Array.isArray(rawData) || rawData.length === 0) {
        setError(`No records found for date: ${selectedDate}. Try selecting another date.`);
        setLoading(false);
        return;
      }

      rawData.forEach((record) => {
        const dotNumber = record.dot_number ? String(record.dot_number).trim() : "N/A";

        let docketList = [];
        for (let i = 1; i <= 5; i++) {
          const prefix = record[`docket${i}_prefix`] || "";
          const number = record[`docket${i}`] || "";

          if (number) {
            const cleanPrefix = String(prefix).trim().toUpperCase();
            const cleanNumber = String(number).trim();
            docketList.push(cleanPrefix ? `${cleanPrefix}-${cleanNumber}` : cleanNumber);
          }
        }

        const mcNumber = docketList.length > 0 ? docketList.join(", ") : "N/A";
        const rawEmail = record.email_address ? String(record.email_address).trim().toLowerCase() : "";
        const email = rawEmail && rawEmail.includes("@") ? rawEmail : "N/A";

        allRecords.push({
          dotNumber,
          mcNumber,
          legalName: record.legal_name ? String(record.legal_name).trim() : "N/A",
          dbaName: record.dba_name ? String(record.dba_name).trim() : "N/A",
          email,
          phone: record.phone ? String(record.phone).trim() : "N/A",
          officer: record.company_officer_1 ? String(record.company_officer_1).trim() : "N/A",
          address: [record.phy_street, record.phy_city, record.phy_state, record.phy_zip].filter(Boolean).join(", "),
          state: record.phy_state || "N/A",
          city: record.phy_city || "N/A",
          zip: record.phy_zip || "N/A",
          powerUnits: record.power_units || "0",
          truckUnits: record.truck_units || "0",
          addDate: record.add_date || "N/A",
          status: record.status_code || "N/A",
          raw: record
        });
      });

      setCarriers(allRecords);
    } catch (err) {
      console.error("FMCSA Fetch Error:", err);
      setError(err.message || "Failed to fetch data from government server.");
    } finally {
      setLoading(false);
    }
  };

  // Search and Email filter
  const filteredCarriers = carriers.filter((carrier) => {
    if (onlyWithEmail && carrier.email === "N/A") return false;
    const query = search.toLowerCase().trim();
    if (!query) return true;

    return (
      carrier.dotNumber.toLowerCase().includes(query) ||
      carrier.mcNumber.toLowerCase().includes(query) ||
      carrier.legalName.toLowerCase().includes(query) ||
      carrier.dbaName.toLowerCase().includes(query) ||
      carrier.email.toLowerCase().includes(query) ||
      carrier.phone.toLowerCase().includes(query) ||
      carrier.city.toLowerCase().includes(query) ||
      carrier.state.toLowerCase().includes(query)
    );
  });

  // Export Professional Excel (.xlsx) with Green Header & Highlighted Columns
  const exportExcelFile = (emailsOnlyMode = false) => {
    const dataToExport = emailsOnlyMode
      ? filteredCarriers.filter((c) => c.email !== "N/A")
      : filteredCarriers;

    if (!dataToExport.length) {
      alert("No matching records available to export.");
      return;
    }

    // Map data to clean objects for Excel sheet
    const excelData = dataToExport.map((c) => ({
      "DOT Number": c.dotNumber,
      "MC / Docket Number": c.mcNumber,
      "Company Legal Name": c.legalName,
      "DBA Name": c.dbaName,
      "Email Address": c.email,
      "Phone Number": c.phone,
      "Officer Name": c.officer,
      "Street Address": c.address || "N/A",
      "City": c.city,
      "State": c.state,
      "ZIP Code": c.zip,
      "Power Units": c.powerUnits,
      "Truck Units": c.truckUnits,
      "Add Date": c.addDate,
      "Status": c.status
    }));

    // Create worksheet using xlsx-js-style library for custom styling support
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const redColumns = ["Phone Number", "Email Address", "Street Address"];
    const headers = Object.keys(excelData[0]);
    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    // Apply Styles to Header and Specific Columns
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;

        const headerName = headers[C];
        if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};

        if (R === 0) {
          // First Row (Header): Dark Green Background & White Bold Text
          worksheet[cellAddress].s = {
            fill: { fgColor: { rgb: "156b3e" } },
            font: { bold: true, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        } else {
          // Data Rows: Light Green Background for Name, Email, Address columns
          if (["Company Legal Name", "Email Address", "Street Address"].includes(headerName)) {
            worksheet[cellAddress].s = {
              fill: { fgColor: { rgb: "D1FAE5" } }, // Light Green Background
              font: { color: { rgb: "065F46" }, bold: true }, // Dark Green Text
              alignment: { horizontal: "left", vertical: "center" }
            };
          }
        }
      }
    }

    // Custom Widths (Email address ko ziada space di gayi hai)
    const colWidths = headers.map((header) => {
      if (header === "Email Address") return { wch: 40 };
      if (header === "Street Address" || header === "Company Legal Name") return { wch: 55 };
      return { wch: 20 };
    });
    worksheet["!cols"] = colWidths;

    // Create workbook and export
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FMCSA Carriers");

    const fileName = emailsOnlyMode
      ? `fiaz_ahmad_${selectedDate}.xlsx`
      : `fiaz_ahmad_Report_${selectedDate}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  // Export JSON
  const exportJSON = () => {
    if (!filteredCarriers.length) return;
    const blob = new Blob(
      [JSON.stringify(filteredCarriers.map((c) => c.raw), null, 2)],
      { type: "application/json" }
    );
    const link = document.createElement("a");
    const downloadUrl = URL.createObjectURL(blob);
    link.href = downloadUrl;
    link.download = `FMCSA_Carriers_${selectedDate}.json`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased">
      
      {/* Top Hero Banner (Matching Home Page Design) */}
      <section className="bg-gradient-to-br from-slate-950 via-[#0d3b22] to-[#156b3e] text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <span className="inline-block bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                APP 1 • SOURCE: DATA.TRANSPORTATION.GOV
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                FMCSA Census
                <span className="text-emerald-300"> Daily Records</span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-200 leading-relaxed">
                Fetch live USDOT, MC/Docket numbers, and verified carrier emails by registration date, then export formatted Excel spreadsheets in one click.
              </p>
            </div>

            {/* Date Selector Card Inside Hero (Glassmorphic Style Like Home) */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl w-full lg:w-[430px] shrink-0">
              <label className="block text-xs font-bold uppercase tracking-widest text-emerald-300 mb-2">
                Select Record Date
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 bg-slate-900/80 border border-white/20 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition"
                />
                <button
                  onClick={fetchCarriers}
                  disabled={loading}
                  className="bg-white text-[#156b3e] hover:bg-emerald-50 px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition shadow-md cursor-pointer shrink-0"
                >
                  {loading ? "Fetching..." : "Fetch Carriers"}
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-100 font-medium">
                <span>⚡ Direct Socrata API</span>
                <span>📊 Auto-Styled .XLSX</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace Section */}
      <section className="py-10 sm:py-14 bg-slate-50 border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 font-semibold border border-red-200 text-sm flex items-center gap-2.5 shadow-2xs">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Stats Grid (Home Card Style) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 hover:border-[#156b3e]/40 transition p-5 sm:p-6">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Carriers</span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-1">{carriers.length}</h2>
            </div>
            <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 hover:border-[#156b3e]/40 transition p-5 sm:p-6">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">With MC / Docket</span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#156b3e] mt-1">
                {carriers.filter((c) => c.mcNumber !== "N/A").length}
              </h2>
            </div>
            <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 hover:border-[#156b3e]/40 transition p-5 sm:p-6">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Valid Emails</span>
              <h2 className="text-2xl sm:text-4xl font-black text-emerald-600 mt-1">
                {carriers.filter((c) => c.email !== "N/A").length}
              </h2>
            </div>
            <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 hover:border-[#156b3e]/40 transition p-5 sm:p-6">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Active Date</span>
              <h2 className="text-lg sm:text-2xl font-black text-slate-800 mt-2 font-mono">{selectedDate}</h2>
            </div>
          </div>

          {/* Results Directory Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Toolbar Header */}
            <div className="p-5 sm:p-7 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#156b3e]">
                  VERIFIED DIRECTORY
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  Carrier Records ({filteredCarriers.length})
                </h2>
              </div>

              <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
                <button
                  onClick={() => exportExcelFile(true)}
                  disabled={!filteredCarriers.length}
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl disabled:opacity-40 transition text-xs sm:text-sm font-bold shadow-2xs cursor-pointer"
                >
                  Export Emails Excel
                </button>
                <button
                  onClick={() => exportExcelFile(false)}
                  disabled={!filteredCarriers.length}
                  className="flex-1 sm:flex-none bg-[#156b3e] hover:bg-[#115431] text-white px-5 py-3 rounded-xl disabled:opacity-40 transition text-xs sm:text-sm font-bold shadow-2xs cursor-pointer"
                >
                  Export Full Excel
                </button>
                <button
                  onClick={exportJSON}
                  disabled={!filteredCarriers.length}
                  className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl disabled:opacity-40 transition text-xs sm:text-sm font-bold shadow-2xs cursor-pointer"
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search DOT, MC, company name, email, city, or state..."
                className="flex-1 border border-slate-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#156b3e] text-sm"
              />
              <label className="inline-flex items-center gap-2.5 px-4 py-3 bg-white border border-slate-300 rounded-xl cursor-pointer select-none text-sm font-semibold text-slate-700 hover:border-[#156b3e] transition">
                <input
                  type="checkbox"
                  checked={onlyWithEmail}
                  onChange={(e) => setOnlyWithEmail(e.target.checked)}
                  className="w-4 h-4 accent-[#156b3e] rounded"
                />
                <span>Only With Email</span>
              </label>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="p-16 text-center text-[#156b3e] font-bold text-base sm:text-lg animate-pulse">
                Connecting to FMCSA Server & Loading Records...
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredCarriers.length === 0 && (
              <div className="text-center p-16 text-slate-500 font-medium text-sm">
                No records found. Select a date above and click "Fetch Carriers".
              </div>
            )}

            {/* Desktop Table */}
            {!loading && filteredCarriers.length > 0 && (
              <div className="hidden md:block overflow-x-auto w-full max-h-[650px]">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-slate-100 sticky top-0 z-10">
                    <tr>
                      {["DOT Number", "MC / Docket", "Company Legal Name", "Email Address", "Phone", "City / State", "Units", "Add Date"].map((heading) => (
                        <th key={heading} className="px-5 py-4 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredCarriers.map((carrier, index) => (
                      <tr key={carrier.dotNumber + "-" + index} className="hover:bg-emerald-50/70 transition-colors text-sm">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{carrier.dotNumber}</td>
                        <td className="px-5 py-3.5 font-bold text-[#156b3e]">
                          {carrier.mcNumber !== "N/A" ? (
                            <span className="bg-emerald-100 text-[#156b3e] px-2.5 py-1 rounded-md text-xs font-bold">{carrier.mcNumber}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">N/A</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-800">{carrier.legalName}</div>
                          {carrier.dbaName !== "N/A" && <div className="text-xs text-slate-500">DBA: {carrier.dbaName}</div>}
                        </td>
                        <td className="px-5 py-3.5">
                          {carrier.email !== "N/A" ? (
                            <a href={`mailto:${carrier.email}`} className="text-emerald-700 font-semibold hover:underline">{carrier.email}</a>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 font-mono text-xs">{carrier.phone}</td>
                        <td className="px-5 py-3.5 text-slate-700">{carrier.city}, <span className="font-bold">{carrier.state}</span></td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs">Power: <b>{carrier.powerUnits}</b> | Trucks: <b>{carrier.truckUnits}</b></td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{carrier.addDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Stacked Cards */}
            {!loading && filteredCarriers.length > 0 && (
              <div className="md:hidden divide-y divide-slate-200">
                {filteredCarriers.map((carrier, index) => (
                  <div key={carrier.dotNumber + "-mobile-" + index} className="p-4 space-y-2.5 bg-white">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-500 block">DOT #{carrier.dotNumber}</span>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">{carrier.legalName}</h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 ${carrier.mcNumber !== "N/A" ? "bg-emerald-100 text-[#156b3e]" : "bg-slate-100 text-slate-500"}`}>
                        {carrier.mcNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Email:</span>
                        {carrier.email !== "N/A" ? (
                          <a href={`mailto:${carrier.email}`} className="text-emerald-700 font-semibold truncate max-w-[220px]">{carrier.email}</a>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="font-mono font-medium text-slate-800">{carrier.phone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span className="font-medium text-slate-800">{carrier.city}, {carrier.state}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  );
}

export default Mcnumber;