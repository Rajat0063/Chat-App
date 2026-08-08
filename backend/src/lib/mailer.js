import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT || 465),
    secure: Number(process.env.MAIL_PORT || 465) === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  return transporter;
};

const wrap = (title, body) => `
<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f4f7fb;padding:40px 0">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,.06)">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
      <div style="width:40px;height:40px;border-radius:10px;background:#e0e7ff;display:flex;align-items:center;justify-content:center">
        <span style="color:#4338ca;font-size:22px">💬</span>
      </div>
      <h1 style="margin:0;font-size:22px;color:#0f172a">Chatty</h1>
    </div>
    <span style="display:none;max-height:0;overflow:hidden">Verify your Chatty account with this code.</span>
    <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px">${title}</h2>
    ${body}
    <p style="margin-top:32px;color:#64748b;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>`;

const normalizeAddress = (value, name = "Chatty") => {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^"|"$/g, "");
  const angleMatch = trimmed.match(/^(.*)<([^>]+)>$/);
  if (angleMatch) {
    const displayName = angleMatch[1].trim() || name;
    return { name: displayName, address: angleMatch[2].trim() };
  }

  const parts = trimmed.split(/\s+/);
  const lastPart = parts[parts.length - 1];
  const emailMatch = lastPart.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  if (emailMatch) {
    const displayName = parts.slice(0, -1).join(" ").trim() || name;
    return { name: displayName, address: emailMatch[0] };
  }

  return { name, address: trimmed };
};

const otpText = (otp, purpose, expires) =>
  `Chatty ${purpose} Code\n\nYour ${purpose.toLowerCase()} code is: ${otp}\nIt expires in ${expires} minutes.\n\nIf you did not request this, please ignore this email.`;

const sendMail = async ({ to, subject, text, html }) => {
  const rawFrom = process.env.MAIL_FROM || process.env.MAIL_USER;
  const from = normalizeAddress(rawFrom) || { name: "Chatty", address: process.env.MAIL_USER };
  const replyTo = normalizeAddress(process.env.MAIL_REPLY_TO || rawFrom) || from;

  await getTransporter().sendMail({
    from,
    sender: from,
    replyTo,
    envelope: {
      from: from.address,
      to,
    },
    importance: "normal",
    priority: "normal",
    text,
    html,
    subject,
    to,
    headers: {
      "X-Priority": "3",
      "X-MSMail-Priority": "Normal",
      "Importance": "Normal",
      "X-Mailer": "Chatty Mailer",
    },
  });
};

export const sendOtpEmail = async (to, otp) => {
  const html = wrap(
    "Verify your email",
    `<p style="color:#475569;font-size:15px;line-height:1.6">
      Use the verification code below to finish creating your Chatty account. This code expires in 10 minutes.
     </p>
     <div style="margin:24px 0;text-align:center">
       <span style="display:inline-block;font-size:32px;letter-spacing:10px;font-weight:700;color:#4338ca;background:#eef2ff;padding:16px 28px;border-radius:12px">${otp}</span>
     </div>`
  );

  await sendMail({
    to,
    subject: "Chatty verification code",
    text: otpText(otp, "Verification", 10),
    html,
  });
};

export const sendResetEmail = async (to, code, link) => {
  const linkSection = link
    ? `<div style="margin:24px 0;text-align:center">
         <a href="${link}" style="display:inline-block;background:#4338ca;color:#fff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:10px">Reset password</a>
       </div>
       <p style="color:#94a3b8;font-size:12px;word-break:break-all">Or paste this link: ${link}</p>`
    : "";

  const html = wrap(
    "Reset your password",
    `<p style="color:#475569;font-size:15px;line-height:1.6">
      Use the verification code below to reset your Chatty password. The code expires in 30 minutes.
     </p>
     <div style="margin:24px 0;text-align:center">
       <span style="display:inline-block;font-size:32px;letter-spacing:10px;font-weight:700;color:#4338ca;background:#eef2ff;padding:16px 28px;border-radius:12px">${code}</span>
     </div>
     ${linkSection}`
  );

  await sendMail({
    to,
    subject: "Chatty password reset code",
    text: otpText(code, "Password reset", 30),
    html,
  });
};