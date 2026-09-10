import nodemailer from "nodemailer";

let primaryTransporter = null;
let etherealTransporter = null;

const parseEmail = (raw) => {
  if (!raw) return { name: "Chatty", email: "no-reply@chatty.com" };
  const match = raw.match(/^(?:"?([^"]*)"?\s)?<?([^\s>]+)>?$/);
  if (match && match[2]) {
    return {
      name: match[1] || "Chatty",
      email: match[2],
    };
  }
  return { name: "Chatty", email: raw };
};

const getDefaultFrom = () => {
  const configured = process.env.MAIL_FROM || process.env.BREVO_FROM || process.env.MAIL_USER || "no-reply@chatty.com";
  const email = (configured || "no-reply@chatty.com").trim();
  const normalized = email.includes("<") ? email.match(/<([^>]+)>/)?.[1] || email : email;
  const lower = normalized.toLowerCase();

  if (lower.includes("gmail.com") || lower.includes("yahoo.com") || lower.includes("outlook.com") || lower.includes("hotmail.com")) {
    return '"Chatty" <no-reply@chatty.com>';
  }

  if (lower.includes("@chatty.com") || lower.includes("@chatty.app")) {
    return `"Chatty" <${normalized}>`;
  }

  return '"Chatty" <no-reply@chatty.com>';
};

const sendViaBrevoApi = async ({ to, subject, text, html }) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) return null;

  const rawSender = getDefaultFrom();
  const senderObj = parseEmail(rawSender);

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: senderObj,
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`\n✅ [BREVO API EMAIL DELIVERED] Message ID: ${data.messageId} to ${to}\n`);
      return { success: true, messageId: data.messageId, method: "brevo_api" };
    } else {
      console.error(`\n❌ [BREVO API ERROR] Status ${response.status}:`, JSON.stringify(data));
      return null;
    }
  } catch (err) {
    console.error(`\n❌ [BREVO API FETCH FAILED] Error: ${err.message}`);
    return null;
  }
};

const createPrimaryTransporter = () => {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  const service = process.env.MAIL_SERVICE;
  const host = process.env.MAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.MAIL_PORT || 587);

  if (!user || !pass) return null;

  // Gmail optimized configuration
  if (
    (service && service.toLowerCase() === "gmail") ||
    host.includes("gmail") ||
    user.endsWith("@gmail.com")
  ) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  // Standard SMTP configuration
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
  });
};

const getEtherealTransporter = async () => {
  if (etherealTransporter) return etherealTransporter;
  try {
    const testAccount = await nodemailer.createTestAccount();
    etherealTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Created Ethereal Email test account for OTP preview:", testAccount.user);
    return etherealTransporter;
  } catch (err) {
    console.warn("Failed to create Ethereal test account:", err.message);
    return null;
  }
};

export const sendMail = async ({ to, subject, text, html }) => {
  // 1. Try Brevo API First if BREVO_API_KEY is configured
  if (process.env.BREVO_API_KEY) {
    const brevoRes = await sendViaBrevoApi({ to, subject, text, html });
    if (brevoRes) return brevoRes;
  }

  // 2. Primary SMTP / Gmail Delivery
  const mailUser = process.env.MAIL_USER;
  const mailPass = process.env.MAIL_PASS;
  const from = getDefaultFrom();
  const replyTo = process.env.MAIL_REPLY_TO || "support@chatty.com";

  if (mailUser && mailPass) {
    try {
      if (!primaryTransporter) {
        primaryTransporter = createPrimaryTransporter();
      }
      if (primaryTransporter) {
        const info = await primaryTransporter.sendMail({
          from,
          replyTo,
          to,
          subject,
          text,
          html,
        });
        console.log(`\n✅ [REAL EMAIL DELIVERED] Message ID: ${info.messageId} to ${to}\n`);
        return { success: true, messageId: info.messageId, method: "smtp" };
      }
    } catch (err) {
      console.error(`\n❌ [SMTP PRIMARY SEND FAILED] Error: ${err.message}. Trying fallback...\n`);
      primaryTransporter = null;
    }
  }

  // 3. Fallback: Ethereal Test Inbox
  try {
    const ethTransporter = await getEtherealTransporter();
    if (ethTransporter) {
      const info = await ethTransporter.sendMail({
        from: '"Chatty" <no-reply@chatty.com>',
        replyTo: process.env.MAIL_REPLY_TO || "support@chatty.com",
        to,
        subject,
        text,
        html,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`\n========================================`);
      console.log(`✉️ [ETHEREAL TEST EMAIL DELIVERED] To: ${to}`);
      if (previewUrl) {
        console.log(`🔗 Preview Test Email Online: ${previewUrl}`);
      }
      console.log(`========================================\n`);
      return { success: true, previewUrl, method: "ethereal" };
    }
  } catch (err) {
    console.warn("Ethereal test send failed:", err.message);
  }

  // 4. Fallback: Console Sink
  console.log(`\n========================================`);
  console.log(`🔑 [DEV EMAIL SINK] To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`${text}`);
  console.log(`========================================\n`);

  return { success: false, method: "console" };
};

export const sendOtpEmail = async (to, otp) => {
  console.log(`\n🔑 [VERIFICATION OTP FOR ${to}]: ${otp}\n`);
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; color: #1e293b;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
        <h2 style="margin-top: 0; color: #4f46e5; font-size: 24px; text-align: center;">Verify Your Chatty Account</h2>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; text-align: center;">
          Thank you for signing up for Chatty! Please use the 6-digit verification code below to complete your registration.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <div style="font-size: 32px; font-weight: 800; color: #4f46e5; letter-spacing: 8px; padding: 16px 24px; background: #eef2ff; border-radius: 10px; display: inline-block; border: 1px solid #c7d2fe;">
            ${otp}
          </div>
        </div>
        <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
          This verification code expires in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;
  return await sendMail({
    to,
    subject: "Chatty - Your Email Verification Code",
    text: `Your Chatty verification code is: ${otp}`,
    html,
  });
};

export const sendResetEmail = async (to, code) => {
  console.log(`\n🔑 [RESET PASSWORD OTP FOR ${to}]: ${code}\n`);
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; color: #1e293b;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
        <h2 style="margin-top: 0; color: #4f46e5; font-size: 24px; text-align: center;">Reset Your Chatty Password</h2>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; text-align: center;">
          We received a request to reset your Chatty account password. Use the 6-digit code below to set a new password.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <div style="font-size: 32px; font-weight: 800; color: #4f46e5; letter-spacing: 8px; padding: 16px 24px; background: #eef2ff; border-radius: 10px; display: inline-block; border: 1px solid #c7d2fe;">
            ${code}
          </div>
        </div>
        <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
          This reset code expires in <strong>30 minutes</strong>. If you did not request a password reset, please secure your account immediately.
        </p>
      </div>
    </div>
  `;
  return await sendMail({
    to,
    subject: "Chatty - Password Reset Verification Code",
    text: `Your Chatty password reset code is: ${code}`,
    html,
  });
};

