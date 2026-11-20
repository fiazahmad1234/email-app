import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 font-sans border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Info */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#156b3e] flex items-center justify-center text-white font-black text-sm">
              C
            </div>
            <span className="text-lg font-black text-white tracking-tight">CarrierChk</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Official US carrier verification platform for USDOT, MC numbers, safety ratings, and bulk data extraction.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Tools & Apps</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/app1" className="hover:text-emerald-400 transition">FMCSA Census Data</Link></li>
            <li><Link to="/app2" className="hover:text-emerald-400 transition">Carrier Lookup Tool</Link></li>
            <li><Link to="/app3" className="hover:text-emerald-400 transition">Motus Extractor</Link></li>
            <li><Link to="/app" className="hover:text-emerald-400 transition">Downloads</Link></li>
              <li><Link to="/BulkEmailSender " className="hover:text-emerald-400 transition">EmailSender </Link></li>

          </ul>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Quick Navigation</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/" className="hover:text-emerald-400 transition">Home Dashboard</Link></li>
            <li><Link to="/login" className="hover:text-emerald-400 transition">Account Login</Link></li>
            <li><Link to="/registration" className="hover:text-emerald-400 transition">Create Account</Link></li>
               <li><Link to="/Policy" className="hover:text-emerald-400 transition">Policy</Link></li>

          </ul>
        </div>

        {/* Status / Trust */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">System Status</h4>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-emerald-400 text-xs font-bold border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>API Connected (Online)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Synced daily with official transportation database records.
          </p>
        </div>

      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>© 2026 CarrierChk. All rights reserved. Built for high-speed professional logistics.</p>
      </div>
    </footer>
  );
}

export default Footer;