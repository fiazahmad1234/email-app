import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx-js-style";

const RANDOM_SUBJECTS = [
  "360 Logistics LLC — Available lanes today",
  "Dispatch check-in for your trucks",
  "Open freight options with 360 Logistics LLC",
  "Checking availability for your equipment",
  "Freight lanes for active units",
  "360 Logistics LLC — Quick dispatch note",
  "Available loads for your fleet",
  "Connecting from 360 Logistics LLC",
  "Open capacity check — 360 Logistics LLC",
  "Freight support for your drivers",
];

const BODY_MESSAGE = `Hello,

I hope your day is going well. I am a dispatcher with 360 Logistics LLC and wanted to check if you have open trucks or trailers available for freight.

Please let me know what equipment you run when you get a chance.

Thank you,
360 Logistics LLC`;

const DEFAULT_FROM_EMAIL = "johnsmith13072@gmail.com";
const DEFAULT_FROM_NAME = "360 Logistics LLC";
const DEFAULT_MAILJET_URL = "https://api.mailjet.com/v3/send";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const INTERVAL_SECONDS = 60; // 1 minute between emails

function buildMailtoUrl(toEmail, subject, body) {
  return `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

function BulkEmailSender() {
  const [emails, setEmails] = useState([]);
  const [fileName, setFileName] = useState("");
  const [subjectsText, setSubjectsText] = useState(
    RANDOM_SUBJECTS.join("\n")
  );
  const [messageBody, setMessageBody] = useState(BODY_MESSAGE);

  const [mode, setMode] = useState("mailjet"); // "mailjet" | "mailto"
  const [mailjetUrl, setMailjetUrl] = useState(DEFAULT_MAILJET_URL);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [fromEmail, setFromEmail] = useState(DEFAULT_FROM_EMAIL);
  const [fromName, setFromName] = useState(DEFAULT_FROM_NAME);

  const [isRunning, setIsRunning] = useState(false);
  const [currentNum, setCurrentNum] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [logs, setLogs] = useState([]);

  const sendingStepRef = useRef(false);
  const queueRef = useRef({
    emails: [],
    subjects: RANDOM_SUBJECTS,
    message: BODY_MESSAGE,
    mode: "mailjet",
    mailjetUrl: DEFAULT_MAILJET_URL,
    apiKey: "",
    secretKey: "",
    fromEmail: DEFAULT_FROM_EMAIL,
    fromName: DEFAULT_FROM_NAME,
    index: 0,
  });

  const pickRandomSubject = (list) => {
    if (!list.length) return "360 Logistics LLC — Available lanes today";
    return list[Math.floor(Math.random() * list.length)];
  };

  const runEmailAtIndex = async (idx) => {
    if (sendingStepRef.current) return;
    sendingStepRef.current = true;

    const cfg = queueRef.current;
    const recipientFromExcel = cfg.emails[idx];
    if (!recipientFromExcel) {
      sendingStepRef.current = false;
      return;
    }

    const chosenSubject = pickRandomSubject(cfg.subjects);
    setCurrentNum(idx + 1);
    setStatusMsg(
      `Processing ${idx + 1} of ${cfg.emails.length} for ${recipientFromExcel}...`
    );

    try {
      if (cfg.mode === "mailto") {
        const mailtoLink = buildMailtoUrl(
          recipientFromExcel,
          chosenSubject,
          cfg.message
        );
        window.open(mailtoLink, "_blank", "noopener,noreferrer");
        setLogs((prev) => [
          ...prev,
          {
            email: recipientFromExcel,
            subject: chosenSubject,
            mailtoUrl: mailtoLink,
            status: "Composed (Mail App)",
            time: new Date().toLocaleTimeString(),
          },
        ]);
      } else {
        const headers = {
          "Content-Type": "application/json",
        };

        if (cfg.apiKey && cfg.secretKey) {
          headers.Authorization = `Basic ${btoa(
            `${cfg.apiKey}:${cfg.secretKey}`
          )}`;
        }

        const response = await fetch(cfg.mailjetUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            Messages: [
              {
                From: {
                  Email: cfg.fromEmail,
                  Name: cfg.fromName || "360 Logistics LLC",
                },
                To: [
                  {
                    Email: recipientFromExcel,
                  },
                ],
                Subject: chosenSubject,
                TextPart: cfg.message,
              },
            ],
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const msg =
            data?.ErrorMessage ||
            data?.Message ||
            `Mailjet HTTP ${response.status}`;
          throw new Error(msg);
        }

        const msgStatus =
          data?.Messages?.[0]?.Status === "success"
            ? `Sent via Mailjet to ${recipientFromExcel}`
            : `Accepted by Mailjet (${recipientFromExcel})`;

        setLogs((prev) => [
          ...prev,
          {
            email: recipientFromExcel,
            subject: chosenSubject,
            mailtoUrl: "",
            status: msgStatus,
            time: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        {
          email: recipientFromExcel,
          subject: chosenSubject,
          mailtoUrl: buildMailtoUrl(recipientFromExcel, chosenSubject, cfg.message),
          status: `Failed: ${err.message}`,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      sendingStepRef.current = false;
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    const total = queueRef.current.emails.length;
    if (!total) {
      setIsRunning(false);
      return;
    }

    runEmailAtIndex(queueRef.current.index);

    if (queueRef.current.index + 1 >= total) {
      setIsRunning(false);
      setSecondsLeft(0);
      setStatusMsg(`Completed: All ${total} Excel recipients processed.`);
      return;
    }

    setSecondsLeft(INTERVAL_SECONDS);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        const nextIdx = queueRef.current.index + 1;
        if (nextIdx >= queueRef.current.emails.length) {
          clearInterval(timer);
          setIsRunning(false);
          setStatusMsg(
            `Completed: All ${queueRef.current.emails.length} Excel recipients processed.`
          );
          return 0;
        }

        queueRef.current.index = nextIdx;
        runEmailAtIndex(nextIdx);

        if (nextIdx + 1 >= queueRef.current.emails.length) {
          clearInterval(timer);
          setIsRunning(false);
          setStatusMsg(
            `Completed: All ${queueRef.current.emails.length} Excel recipients processed.`
          );
          return 0;
        }

        return INTERVAL_SECONDS;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    setErrorMsg("");
    setStatusMsg("");
    setLogs([]);

    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const extracted = [];
        rows.forEach((row) => {
          Object.values(row).forEach((val) => {
            const raw = String(val || "").trim();
            if (!raw) return;
            raw
              .split(/[\s,;]+/)
              .map((part) => part.trim().toLowerCase())
              .filter((part) => EMAIL_REGEX.test(part))
              .forEach((clean) => extracted.push(clean));
          });
        });

        const unique = [...new Set(extracted)];
        if (!unique.length) {
          setErrorMsg("Excel file mein koi valid recipient email nahi mila.");
          setEmails([]);
          return;
        }

        setEmails(unique);
        setStatusMsg(
          `${unique.length} recipient emails imported from "${file.name}". Ready for 1-minute Mailjet queue.`
        );
      } catch (err) {
        setErrorMsg("Excel file read karne mein error aaya: " + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleStart = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLogs([]);

    const subjects = subjectsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!emails.length) {
      setErrorMsg("Pehle recipient emails wali Excel file import karein.");
      return;
    }

    if (mode === "mailjet") {
      if (!mailjetUrl.trim()) {
        setErrorMsg("Mailjet endpoint URL enter karein.");
        return;
      }
      if (!fromEmail.trim() || !EMAIL_REGEX.test(fromEmail.trim())) {
        setErrorMsg("Valid verified From Email enter karein.");
        return;
      }
    }

    const finalSubjects = subjects.length ? subjects : RANDOM_SUBJECTS;
    const finalMessage = messageBody.trim() || BODY_MESSAGE;

    queueRef.current = {
      emails,
      subjects: finalSubjects,
      message: finalMessage,
      mode,
      mailjetUrl: mailjetUrl.trim(),
      apiKey: apiKey.trim(),
      secretKey: secretKey.trim(),
      fromEmail: fromEmail.trim().toLowerCase(),
      fromName: fromName.trim() || DEFAULT_FROM_NAME,
      index: 0,
    };

    setCurrentNum(1);
    setSecondsLeft(emails.length > 1 ? INTERVAL_SECONDS : 0);
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    setSecondsLeft(0);
    setStatusMsg("Automatic sending stopped.");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col justify-between">
      <section className="bg-gradient-to-br from-slate-950 via-[#0d3b22] to-[#156b3e] text-white py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="inline-block bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              MAILJET API • 10 RANDOM SUBJECTS • 1-MIN INTERVAL
            </span>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              360 Logistics Auto Sender
              <span className="block text-emerald-300">Mailjet Queue</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed">
              Extracts recipient emails from your Excel file, cycles through 10
              random subject lines, sends the same message body via Mailjet, and
              runs every 1 minute.
            </p>

            <div className="pt-3 border-t border-white/15 flex flex-wrap gap-3 text-xs font-bold text-emerald-100">
              <span>Excel Recipients: {emails.length}</span>
              <span>•</span>
              <span>From: {fromEmail}</span>
              <span>•</span>
              <span>Interval: 60s</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <form
              onSubmit={handleStart}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4"
            >
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-emerald-300 mb-1.5">
                  1. Import Excel File (Recipient Emails)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                  disabled={isRunning}
                  className="w-full text-xs sm:text-sm text-slate-200 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-white file:text-[#156b3e] hover:file:bg-emerald-50 bg-slate-900/70 border border-white/20 rounded-xl p-2 cursor-pointer"
                />
                {fileName && (
                  <p className="text-[11px] text-emerald-200 mt-1 font-mono truncate">
                    {fileName} — {emails.length} recipient emails
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                  Send Mode
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  disabled={isRunning}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-white/20 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="mailjet">Mailjet Send API</option>
                  <option value="mailto">Browser Mail App</option>
                </select>
              </div>

              {mode === "mailjet" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                      Mailjet Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={mailjetUrl}
                      onChange={(e) => setMailjetUrl(e.target.value)}
                      disabled={isRunning}
                      className="w-full px-3 py-2 bg-slate-900/80 border border-white/20 rounded-xl text-xs font-mono text-white outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                        Mailjet API Key
                      </label>
                      <input
                        type="text"
                        placeholder="MJ_APIKEY_PUBLIC"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        disabled={isRunning}
                        className="w-full px-3 py-2 bg-slate-900/80 border border-white/20 rounded-xl text-xs font-mono text-white outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                        Mailjet Secret Key
                      </label>
                      <input
                        type="password"
                        placeholder="MJ_APIKEY_PRIVATE"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        disabled={isRunning}
                        className="w-full px-3 py-2 bg-slate-900/80 border border-white/20 rounded-xl text-xs font-mono text-white outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                        Verified From Email
                      </label>
                      <input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        disabled={isRunning}
                        className="w-full px-3 py-2 bg-slate-900/80 border border-white/20 rounded-xl text-xs font-mono text-white outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                        From Name
                      </label>
                      <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        disabled={isRunning}
                        className="w-full px-3 py-2 bg-slate-900/80 border border-white/20 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-emerald-300 mb-1.5">
                  2. Random Subjects (10 Options)
                </label>
                <textarea
                  rows={4}
                  value={subjectsText}
                  onChange={(e) => setSubjectsText(e.target.value)}
                  disabled={isRunning}
                  className="w-full p-3 bg-slate-900/80 border border-white/20 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-emerald-300 mb-1.5">
                  3. Message Body (Same For All Excel Recipients)
                </label>
                <textarea
                  rows={6}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  disabled={isRunning}
                  className="w-full p-3 bg-slate-900/80 border border-white/20 rounded-xl text-xs sm:text-sm text-white outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {errorMsg && (
                <div className="bg-red-500/20 border border-red-400/60 text-red-100 rounded-xl px-4 py-3 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {isRunning && (
                <div className="bg-emerald-500/20 border border-emerald-300/40 text-emerald-100 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-black text-emerald-300">
                      Auto Sending #{currentNum} of {emails.length}
                    </p>
                    <p className="text-sm font-mono font-bold">
                      {emails.length > 1 && secondsLeft > 0
                        ? `Next Excel recipient in ${secondsLeft}s`
                        : "Finalizing..."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStop}
                    className="bg-red-500/80 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition"
                  >
                    Stop
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isRunning}
                  className="w-full sm:w-auto bg-white text-[#156b3e] hover:bg-emerald-50 font-extrabold px-8 py-3.5 rounded-xl text-sm cursor-pointer disabled:opacity-50 shadow-md transition"
                >
                  {isRunning ? `Auto Running (${secondsLeft}s)` : "Start Auto Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          {statusMsg && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm font-bold text-[#156b3e] shadow-2xs">
              {statusMsg}
            </div>
          )}

          {logs.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-5 sm:p-6 border-b border-slate-200">
                <h2 className="text-lg font-black text-slate-900">
                  Sent Log ({logs.length}/{emails.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                      <th className="p-4 font-black">Excel Recipient</th>
                      <th className="p-4 font-black">Random Subject</th>
                      <th className="p-4 font-black">Time</th>
                      <th className="p-4 font-black">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {logs.map((item, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/40">
                        <td className="p-4 font-mono font-bold text-slate-900">
                          {item.email}
                        </td>
                        <td className="p-4 font-semibold text-slate-800">
                          {item.subject}
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-600">
                          {item.time}
                        </td>
                        <td className="p-4 flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#156b3e]">
                            {item.status}
                          </span>
                          {item.mailtoUrl && (
                            <a
                              href={item.mailtoUrl}
                              className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
                            >
                              Open Mail
                            </a>
                          )}
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

export default BulkEmailSender;