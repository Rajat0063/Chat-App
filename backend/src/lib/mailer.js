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

const sendMail = async ({ to, subject, text, html }) => {
  try {
    const sentViaBrevo = await sendWithBrevo({ to, subject, text, html });
    if (sentViaBrevo) return;
  } catch (brevoError) {
    console.warn("Brevo failed, falling back to SMTP:", brevoError.message);
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
