import React from "react";
import { Link } from "react-router-dom";

function Home() {
  const tools = [
    {
      badge: "APP 1",
      icon: "📊",
      title: "FMCSA Census Data",
      desc: "Query official transportation records by USDOT or MC numbers with fast batch lookups for dispatchers and brokers.",
      path: "/app1",
      cta: "Open FMCSA Data",
    },
    {
      badge: "APP 2",
      icon: "🔍",
      title: "Carrier Lookup",
      desc: "Verify carrier authority status, safety profiles, and core operating details in seconds before booking freight.",
      path: "/app2",
      cta: "Launch Lookup",
    },
    {
      badge: "APP 3",
      icon: "🚚",
      title: "Motus Extractor",
      desc: "Batch-extract carrier legal names, emails, phone numbers, and street addresses, then export styled .xlsx sheets.",
      path: "/app3",
      cta: "Open Motus Extractor",
    },
  ];

  return (
    <div className="bg-white text-slate-800 font-sans antialiased">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-950 via-[#0d3b22] to-[#156b3e] text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">

          <div>
            <span className="inline-block bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5">
              HTTPS://CARRIERCHK.COM/ • US Carrier Intelligence
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Verify Any US Carrier
              <span className="block text-emerald-300">in Seconds</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-200 max-w-xl leading-relaxed">
              Search multiple US carriers by USDOT or MC numbers, check authority and safety details, extract contact records, and export ready-to-use Excel reports.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/app2"
                className="bg-white text-[#156b3e] px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-50 transition shadow-md"
              >
                Start Carrier Lookup
              </Link>

              <Link
                to="/app3"
                className="border border-white/40 text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 transition"
              >
                Motus Extractor
              </Link>
            </div>

            {/* Trust Strip */}
            <div className="mt-10 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-emerald-100">
              <div>✓ 4.4M+ Carrier Records</div>
              <div>⚡ Fast Batch Queries</div>
              <div>📊 Styled .XLSX Export</div>
              <div>🛡️ Public DOT Data</div>
            </div>
          </div>

          {/* Right Live Workflow Preview Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
                  Live Workflow Suite
                </p>
                <h2 className="text-xl font-black text-white mt-0.5">
                  CarrierChk Workspace
                </h2>
              </div>
              <span className="text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-3 py-1 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-3.5 text-left">
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-300">1. Batch DOT / MC Input</p>
                  <p className="text-xs text-slate-300 mt-0.5 font-mono">6846840 • 8422854 • 4864674</p>
                </div>
                <span className="text-lg">📋</span>
              </div>

              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-300">2. Direct Public API Fetch</p>
                  <p className="text-xs text-slate-300 mt-0.5">Legal Name, Email, Phone & Street Address</p>
                </div>
                <span className="text-lg">⚡</span>
              </div>

              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-300">3. Styled Excel (.xlsx) Download</p>
                  <p className="text-xs text-slate-300 mt-0.5">Dark green headers & highlighted key columns</p>
                </div>
                <span className="text-lg">📥</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Core Tools Section */}
      <section id="tools" className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">

          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#156b3e]">
              CARRIER TOOLS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
              Built for Freight Dispatch & Vetting
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">
              Switch between dedicated lookup and extraction modules designed for speed, accuracy, and clean spreadsheet exports.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {tools.map((tool) => (
              <div
                key={tool.path}
                className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#156b3e]/40 hover:shadow-xl transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 bg-emerald-100 text-[#156b3e] rounded-xl flex items-center justify-center text-2xl">
                      {tool.icon}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {tool.title}
                  </h3>
                  <p className="text-slate-600 mt-2.5 text-sm leading-relaxed">
                    {tool.desc}
                  </p>
                </div>

                <Link
                  to={tool.path}
                  className="mt-6 inline-flex items-center justify-center bg-[#156b3e] hover:bg-[#115431] text-white text-xs font-bold px-5 py-3 rounded-xl transition"
                >
                  {tool.cta} →
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* About / Why CarrierChk Section */}
      <section className="py-20 sm:py-24 bg-slate-50 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          <div className="bg-gradient-to-br from-[#156b3e] to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              WHY CARRIERCHK
            </span>
            <h3 className="text-2xl sm:text-3xl font-black mt-2">
              Faster Vetting. Cleaner Spreadsheets.
            </h3>
            <p className="text-slate-200 mt-4 text-sm leading-relaxed">
              Stop checking carriers one by one across slow pages. Paste multiple numbers, pull structured carrier records, and export formatted Excel files ready for outreach or compliance review.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-emerald-100">
              <li>• Deduplicates repeated USDOT / MC numbers automatically</li>
              <li>• Extracts company name, email, phone, and physical address</li>
              <li>• Exports pre-styled <span className="font-mono font-bold">.xlsx</span> files with custom column widths</li>
              <li>• Responsive layout across desktop, tablet, and mobile screens</li>
            </ul>
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#156b3e]">
              ABOUT THE PLATFORM
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
              Streamlined Carrier Data for Modern Logistics
            </h2>
            <p className="text-slate-600 mt-5 text-sm sm:text-base leading-relaxed">
              CarrierChk brings together fast public transportation data queries and clean export tools so dispatchers, freight brokers, and operations teams can verify carriers without friction.
            </p>
            <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
              Whether you are screening a handful of carriers or processing a batch list, every view is built to stay fast, readable, and easy to manage.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/registration"
                className="bg-[#156b3e] hover:bg-[#115431] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition shadow-sm"
              >
                Create Account
              </Link>
              <Link
                to="/app"
                className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 px-6 py-3.5 rounded-xl font-bold text-sm transition"
              >
                App & Downloads
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-20 bg-[#156b3e]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to Check Your Carriers?
          </h2>
          <p className="mt-4 text-emerald-100 text-sm sm:text-lg max-w-2xl mx-auto">
            Jump straight into carrier lookup or Motus extraction, or create your account to get started.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/registration"
              className="bg-white text-[#156b3e] px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-50 transition shadow-md"
            >
              Register Now
            </Link>
            <Link
              to="/app2"
              className="border border-white/50 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 transition"
            >
              Search Carriers
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;