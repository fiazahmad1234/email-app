import React, { useState } from "react";
import * as XLSX from "xlsx-js-style";

function MotusExtractor() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  const handleExtract = async () => {
    const dots = [
      ...new Set(
        inputText
          .split(/[\s,;]+/)
          .map((x) => x.trim())
          .filter((x) => /^\d+$/.test(x))
      ),
    ];

    if (!dots.length) {
      alert("Please enter valid DOT numbers.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setResults([]);
    setStatusMessage(`Fetching ${dots.length} carrier account records...`);

    const collected = [];

    try {
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const accountUrl = `https://motus.dot.gov/customer/${dot}/account`;
        setStatusMessage(
          `Checking USDOT #${dot} (${i + 1} of ${dots.length})...`
        );

        let data = null;
        try {
          const res = await fetch("/api/motus-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dot }),
          });
          const rawText = await res.text();
          if (rawText) data = JSON.parse(rawText);
        } catch (err) {
          data = {
            ok: false,
            error: err?.message || "API Route Not Reachable",
          };
        }

        collected.push(
          data?.ok && data?.results?.[0]
            ? data.results[0]
            : {
                dot,
                url: accountUrl,
                legalName: "N/A",
                email: "",
                phone: "N/A",
                address: "N/A",
                status: data?.error || "Empty / API Route Not Reachable",
              }
        );

        setResults([...collected]);
        setProgress(Math.round(((i + 1) / dots.length) * 100));
      }

      const foundCount = collected.filter((r) => r.email).length;
      setStatusMessage(
        `Completed: ${foundCount} verified emails found out of ${dots.length} USDOT records.`
      );
    } catch (err) {
      setStatusMessage("Error: " + (err?.message || "Unexpected error"));
    } finally {
      setLoading(false);
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
      "Principal Address": r.address || "N/A",
      Status: r.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Motus Accounts");
    XLSX.writeFile(workbook, "fiaz-Motus-Accounts.xlsx");
  };

  const foundCount = results.filter((r) => r.email).length;
  const notFoundCount = results.length - foundCount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col justify-between">
      <section className="bg-gradient-to-br from-slate-950 via-[#0d3b22] to-[#156b3e] text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="inline-flex items-center gap-2 bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              FMCSA MOTUS ACCOUNT VERIFIER
            </span>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Carrier Account Lookup
              <span className="block text-emerald-300">
                Clean &amp; Instant Data
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed">
              Paste one or more USDOT numbers to pull legal business names,
              verified business emails, and contact phone numbers directly from
              official carrier account records.
            </p>

            <div className="pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold text-emerald-100">
              <span>✓ Batch USDOT Lookup</span>
              <span>✓ Direct Email Extraction</span>
              <span>✓ One-Click Excel Export</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-black uppercase tracking-widest text-emerald-300">
                  USDOT Numbers List
                </label>
                <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  Bulk Ready
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={"8706617\n7995726\n5668149"}
                className="w-full min-h-[175px] p-4 bg-slate-900/80 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-400 font-mono leading-relaxed transition"
              />

              {loading && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold text-emerald-200 gap-2">
                    <span className="truncate">{statusMessage}</span>
                    <span className="font-mono shrink-0">{progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-900/80 p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <span className="text-xs text-emerald-100/80">
                  Separate numbers by line, space, or comma.
                </span>
                <button
                  onClick={handleExtract}
                  disabled={loading}
                  className="w-full sm:w-auto bg-white text-[#156b3e] hover:bg-emerald-50 font-extrabold px-8 py-3.5 rounded-xl transition text-sm cursor-pointer disabled:opacity-50 shadow-md shrink-0"
                >
                  {loading ? "Extracting Records..." : "Extract Carrier Data"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-slate-50 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          {statusMessage && (
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-[#156b3e] shadow-2xs">
              {statusMessage}
            </div>
          )}

          {results.length === 0 && !loading && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-2xs space-y-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Ready to Lookup Carrier Accounts
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Enter your USDOT numbers above and click{" "}
                <strong className="text-slate-800">Extract Carrier Data</strong>{" "}
                to view company details, business emails, and phone numbers in a
                structured table.
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-wrap gap-3 justify-between items-center text-xs sm:text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 font-extrabold">
                    Total: {results.length}
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-[#156b3e] font-extrabold">
                    Emails Found: {foundCount}
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-extrabold">
                    Not Found: {notFoundCount}
                  </span>
                </div>
                <button
                  onClick={exportExcel}
                  className="bg-[#156b3e] hover:bg-[#115431] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-2xs"
                >
                  Export Excel (.xlsx)
                </button>
              </div>

              <div className="overflow-x-auto px-4 sm:px-6 py-4">
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                      <th className="p-4 font-black rounded-l-xl">USDOT</th>
                      <th className="p-4 font-black">Legal Business Name</th>
                      <th className="p-4 font-black">Business Email</th>
                      <th className="p-4 font-black">Phone Number</th>
                      <th className="p-4 font-black rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {results.map((r, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-emerald-50/50 transition-colors"
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
                            <span className="text-slate-400 font-semibold text-xs">
                              Not Listed
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-700">
                          {r.phone}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              r.email
                                ? "bg-emerald-100 text-[#156b3e]"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default MotusExtractor;