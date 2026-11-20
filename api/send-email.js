import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const { to_email, subject, message } = req.body || {};

  if (!to_email || !subject || !message) {
    return res.status(400).json({
      ok: false,
      error: "to_email, subject, and message are required.",
    });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({
      ok: false,
      error: "Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment variables.",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"360 Logistics LLC" <${gmailUser}>`,
      to: to_email,
      replyTo: gmailUser,
      subject,
      text: message,
    });

    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}