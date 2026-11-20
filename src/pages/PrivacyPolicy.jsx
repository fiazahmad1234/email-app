import React from "react";

const COMPANY_NAME = "360 Logistics LLC";
const CONTACT_EMAIL = "support@360logisticsllc.com";
const LAST_UPDATED = "November 20, 2026";

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <section className="bg-gradient-to-br from-slate-950 via-[#0d3b22] to-[#156b3e] text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-3">
          <span className="inline-block bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            LEGAL &amp; DATA PROTECTION
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-slate-200">
            {COMPANY_NAME} — Last Updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 leading-relaxed text-sm sm:text-base text-slate-700">
          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900">
              1. Overview
            </h2>
            <p>
              <strong>{COMPANY_NAME}</strong> respects your privacy and is
              committed to handling contact and communication data responsibly.
              This Privacy Policy explains how information is used when we
              communicate regarding freight lanes, dispatch coordination, and
              logistics services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900">
              2. Information We Process
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Contact Details:</strong> Email addresses, names, phone
                numbers, or carrier/company details provided directly by you,
                submitted via forms, or shared with consent.
              </li>
              <li>
                <strong>Communication Records:</strong> Subject lines, dispatch
                messages, timestamps, and delivery or response status related to
                freight inquiries.
              </li>
              <li>
                <strong>Technical &amp; Usage Data:</strong> Basic browser,
                session, or diagnostic logs required to operate our web tools
                securely and reliably.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900">
              3. How We Use Information &amp; Email Delivery
            </h2>
            <p>
              We use contact information to coordinate dispatch opportunities,
              respond to inquiries about truck or trailer capacity, maintain
              service records, and prevent abuse. Outbound emails may be
              transmitted through third-party email delivery infrastructure such
              as <strong>Mailjet</strong> in accordance with applicable
              anti-spam and data protection standards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900">
              4. Consent &amp; Opt-Out Rights
            </h2>
            <p>
              We aim to communicate only with contacts who have an active
              business relationship or have given appropriate consent. You may
              request to unsubscribe, stop receiving dispatch messages, or
              update/delete your contact details at any time by emailing{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-bold text-[#156b3e] underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900">
              5. Data Security &amp; Retention
            </h2>
            <p>
              We apply reasonable administrative and technical safeguards to
              protect contact information from unauthorized access or disclosure.
              Data is retained only for as long as necessary for dispatch
              operations, compliance, or until a removal request is processed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900">
              6. Third-Party Services
            </h2>
            <p>
              Trusted service providers (such as email delivery and hosting
              providers) may process limited data strictly to perform services
              on behalf of {COMPANY_NAME}. We do not sell personal contact lists
              to unauthorized third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900">
              7. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy or want to submit a
              privacy or opt-out request, contact <strong>{COMPANY_NAME}</strong>{" "}
              at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-bold text-[#156b3e] underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default PrivacyPolicy;