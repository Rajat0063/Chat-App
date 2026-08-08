import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.MAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.MAIL_PORT || (host.includes("gmail") ? 587 : 465));
  const secure = port === 465;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  return transporter;
};

const getFromAddress = () => {
  const configured = [
    process.env.BREVO_FROM,
    process.env.RESEND_FROM,
    process.env.MAIL_FROM,
    process.env.MAIL_USER,
  ].find((value) => typeof value === "string" && value.trim().length > 0);

  if (!configured) {
    return "noreply@chatty.app";
  }

  const parsed = normalizeAddress(configured, "Chatty");
  if (!parsed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.address)) {
    return "noreply@chatty.app";
  }

  return parsed.address;
};

const sendWithBrevo = async ({ to, subject, text, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Chatty",
        email: getFromAddress(),
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API failed: ${response.status} ${errorText}`);
  }

  return true;
};

const sendWithResend = async ({ to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [to],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API failed: ${response.status} ${errorText}`);
  }

  return true;
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
  try {
    const sentViaBrevo = await sendWithBrevo({ to, subject, text, html });
    if (sentViaBrevo) return;
  } catch (brevoError) {
    console.warn("Brevo failed, trying Resend:", brevoError.message);
  }

  try {
    const sentViaResend = await sendWithResend({ to, subject, text, html });
    if (sentViaResend) return;
  } catch (resendError) {
    console.warn("Resend failed, falling back to SMTP:", resendError.message);
  }

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log(`\n========================================\n[DEV / PREVIEW MAIL SINK]\nTo: ${to}\nSubject: ${subject}\n${text}\n========================================\n`);
    return;
  }

  const rawFrom = process.env.MAIL_FROM || process.env.MAIL_USER;
  const from = normalizeAddress(rawFrom) || { name: "Chatty", address: process.env.MAIL_USER };
  const replyTo = normalizeAddress(process.env.MAIL_REPLY_TO || rawFrom) || from;

  await getTransporter().verify();

  await getTransporter().sendMail({
    from,
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

export const sendResetEmail = async (to, code) => {
  const html = wrap(
    "Reset your password",
    `<p style="color:#475569;font-size:15px;line-height:1.6">
      Use the 6-digit verification code below to reset your Chatty password. This code expires in 30 minutes.
     </p>
     <div style="margin:24px 0;text-align:center">
       <span style="display:inline-block;font-size:32px;letter-spacing:10px;font-weight:700;color:#4338ca;background:#eef2ff;padding:16px 28px;border-radius:12px">${code}</span>
     </div>
     <p style="color:#64748b;font-size:13px;text-align:center">Enter this code on the password reset page in Chatty to update your password.</p>`
  );

  await sendMail({
    to,
    subject: "Chatty password reset code",
    text: otpText(code, "Password reset", 30),
    html,
  });
};
