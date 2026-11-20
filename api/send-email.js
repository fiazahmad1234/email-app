import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const { to_email, subject, message, senderName } = req.body || {};

  if (!to_email || !subject || !message) {
    return res.status(400).json({
      ok: false,
      error: "to_email, subject, and message are required.",
    });
  }

  const smtpHost = "mail.kayadevelopmentserver.com";
  const smtpPort = 465;
  const smtpUser = "dispatch@kayadevelopmentserver.com";
  const smtpPass = "0AlT$VIAX~}h,AVN";
  const fromName = String(senderName || "360 Logistics LLC").trim();

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${smtpUser}>`,
      to: String(to_email).trim(),
      replyTo: smtpUser,
      subject: String(subject).trim(),
      text: String(message),
    });

    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Failed to send email." });
  }
}