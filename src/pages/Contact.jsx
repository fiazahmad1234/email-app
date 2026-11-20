import React, { useState } from "react";

const PHONE_NUMBER = "03067098742";
const WHATSAPP_NUMBER = "03067098742";
const EMAIL_ADDRESS = "fiazahmad13072@gmail.com";

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Carrier Verification & Data Support");
  const [message, setMessage] = useState("");
  const [submittedMsg, setSubmittedMsg] = useState("");
  const [copiedField, setCopiedField] = useState("");

  const cleanWhatsAppNumber = WHATSAPP_NUMBER.replace(/\D/g, "").startsWith("0")
    ? "92" + WHATSAPP_NUMBER.replace(/\D/g, "").slice(1)
    : WHATSAPP_NUMBER.replace(/\D/g, "");

  const handleCopy = (label, value) => {
    navigator.clipboard?.writeText(value);
    setCopiedField(label);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmittedMsg("");

    const savedInquiries = JSON.parse(
      localStorage.getItem("carrierchk_inquiries") || "[]"
    );

    const newInquiry = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "carrierchk_inquiries",
      JSON.stringify([newInquiry, ...savedInquiries])
    );

    setSubmittedMsg(
      `Thank you, ${name.trim()}! Your message has been received. You can also reach us directly at ${EMAIL_ADDRESS} or WhatsApp ${WHATSAPP_NUMBER}.`
    );
    setName("");
    setEmail("");
    setSubject("Carrier Verification & Data Support");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased">
      {/* Top Hero Section (Matching Home & Tools Theme) */}
      <section className="bg-gradient-to-br from-slate-950 via-[#0d3b22] to-[#156b3e] text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <span className="inline-block bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              CARRIERCHK SUPPORT • DIRECT CONTACT
            </span>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Get in Touch
              <span className="block text-emerald-300">With Our Team</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed">
              Have questions about FMCSA daily census exports, bulk MC lookups, Motus data extraction, or custom tooling? Reach out directly via phone, WhatsApp, email, or the inquiry form below.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${cleanWhatsAppNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#156b3e] hover:bg-emerald-50 font-extrabold text-sm shadow-md transition"
              >
                <span>Chat on WhatsApp</span>
              </a>
              <a
                href={`mailto:${EMAIL_ADDRESS}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/25 text-white font-bold text-sm transition"
              >
                <span>Send Email</span>
              </a>
            </div>
          </div>

          {/* Right Quick Summary Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-300 block">
                DIRECT CHANNELS
              </span>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 bg-slate-950/50 border border-white/10 rounded-2xl px-4 py-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-emerald-200/80 block font-bold">
                      Phone & WhatsApp
                    </span>
                    <a
                      href={`tel:${PHONE_NUMBER}`}
                      className="font-mono font-bold text-white hover:text-emerald-300 transition"
                    >
                      {PHONE_NUMBER}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy("phone", PHONE_NUMBER)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 transition cursor-pointer shrink-0"
                  >
                    {copiedField === "phone" ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 bg-slate-950/50 border border-white/10 rounded-2xl px-4 py-3">
                  <div className="min-w-0">
                    <span className="text-[11px] uppercase tracking-wider text-emerald-200/80 block font-bold">
                      Email Address
                    </span>
                    <a
                      href={`mailto:${EMAIL_ADDRESS}`}
                      className="font-semibold text-white hover:text-emerald-300 transition truncate block"
                    >
                      {EMAIL_ADDRESS}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy("email", EMAIL_ADDRESS)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 transition cursor-pointer shrink-0"
                  >
                    {copiedField === "email" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Workspace */}
      <section className="py-10 sm:py-14 bg-slate-50 border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          {/* 3 Contact Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 hover:border-[#156b3e]/40 transition p-6 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#156b3e]">
                PHONE SUPPORT
              </span>
              <h2 className="text-xl font-black text-slate-900">Call Direct</h2>
              <p className="text-xs text-slate-500">
                Speak directly for carrier lookup assistance and account inquiries.
              </p>
              <a
                href={`tel:${PHONE_NUMBER}`}
                className="inline-block pt-2 font-mono font-extrabold text-base text-[#156b3e] hover:underline"
              >
                {PHONE_NUMBER}
              </a>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 hover:border-[#156b3e]/40 transition p-6 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#156b3e]">
                INSTANT MESSAGING
              </span>
              <h2 className="text-xl font-black text-slate-900">WhatsApp</h2>
              <p className="text-xs text-slate-500">
                Fast message support for daily FMCSA sheets and Motus extraction.
              </p>
              <a
                href={`https://wa.me/${cleanWhatsAppNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block pt-2 font-mono font-extrabold text-base text-[#156b3e] hover:underline"
              >
                WhatsApp: {WHATSAPP_NUMBER}
              </a>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 hover:border-[#156b3e]/40 transition p-6 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#156b3e]">
                OFFICIAL EMAIL
              </span>
              <h2 className="text-xl font-black text-slate-900">Email Us</h2>
              <p className="text-xs text-slate-500">
                Send detailed requests, custom export requirements, or feedback.
              </p>
              <a
                href={`mailto:${EMAIL_ADDRESS}`}
                className="inline-block pt-2 font-bold text-sm sm:text-base text-[#156b3e] hover:underline break-all"
              >
                {EMAIL_ADDRESS}
              </a>
            </div>
          </div>

          {/* Contact Form Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#156b3e]">
                  SEND A MESSAGE
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                  Contact Inquiry Form
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Fill out your details below and we will get back to you promptly.
                </p>
              </div>

              {submittedMsg && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-[#156b3e] rounded-2xl text-sm font-semibold">
                  {submittedMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 border border-slate-300 bg-slate-50 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#156b3e] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                      Your Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 border border-slate-300 bg-slate-50 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#156b3e] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-300 bg-slate-50 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#156b3e] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    placeholder="Write your message or question here..."
                    className="w-full px-4 py-3 border border-slate-300 bg-slate-50 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#156b3e] transition"
                  ></textarea>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <span className="text-xs text-slate-500 font-medium">
                    Direct Email: <b className="text-slate-700">{EMAIL_ADDRESS}</b> · Phone/WhatsApp: <b className="text-slate-700">{PHONE_NUMBER}</b>
                  </span>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-[#156b3e] hover:bg-[#115431] text-white font-bold px-8 py-3.5 rounded-xl transition text-sm cursor-pointer shadow-sm"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;