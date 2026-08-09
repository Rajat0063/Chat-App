import Feedback from "../models/FeedbackModel.js";
import { sendMail } from "../lib/mailer.js";

const getDeveloperRecipient = () => {
  return (
    process.env.DEVELOPER_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.MAIL_USER ||
    process.env.MAIL_FROM ||
    null
  );
};

const notifyDeveloperAboutFeedback = async (feedback, user) => {
  const recipient = getDeveloperRecipient();
  if (!recipient) {
    console.warn("[FEEDBACK] No developer email configured. Feedback saved only to DB.");
    return { success: false, reason: "no-recipient" };
  }

  const subject = `[Chatty Feedback] ${feedback.type.toUpperCase()} - ${feedback.subject}`;
  const text = [
    "New feedback received from Chatty user.",
    "",
    `Name: ${user?.fullName || user?.email || "Unknown user"}`,
    `Email: ${user?.email || feedback.userEmail}`,
    `Type: ${feedback.type}`,
    `Severity: ${feedback.severity}`,
    `Subject: ${feedback.subject}`,
    "",
    "Description:",
    feedback.description,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #f8fafc; padding: 24px; color: #0f172a;">
      <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 16px; color: #1d4ed8;">New Chatty Feedback</h2>
        <p><strong>From:</strong> ${user?.fullName || user?.email || "Unknown user"} (${user?.email || feedback.userEmail})</p>
        <p><strong>Type:</strong> ${feedback.type}</p>
        <p><strong>Severity:</strong> ${feedback.severity}</p>
        <p><strong>Subject:</strong> ${feedback.subject}</p>
        <div style="margin-top: 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; line-height: 1.6; white-space: pre-wrap;">
          ${feedback.description.replace(/\n/g, "<br />")}
        </div>
      </div>
    </div>
  `;

  try {
    const result = await sendMail({
      to: recipient,
      subject,
      text,
      html,
    });
    console.log(`[FEEDBACK] Developer notification sent via ${result?.method || "mailer"} to ${recipient}`);
    return result;
  } catch (err) {
    console.error("[FEEDBACK] Failed to send developer notification:", err);
    return { success: false, reason: "mail-error" };
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const { type, severity, subject, description } = req.body;
    const user = req.user;

    if (!subject || !description) {
      return res.status(400).json({ message: "Subject and description are required." });
    }

    const newFeedback = await Feedback.create({
      userId: user._id,
      userEmail: user.email,
      userName: user.fullName || "User",
      type: type || "bug",
      severity: severity || "medium",
      subject: subject.trim(),
      description: description.trim(),
      status: "pending",
    });

    await notifyDeveloperAboutFeedback(newFeedback, user);

    res.status(201).json({
      message: "Feedback submitted successfully. The application builder has been notified!",
      feedback: newFeedback,
    });
  } catch (err) {
    console.error("submitFeedback error:", err);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
};

export const getMyFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error("getMyFeedback error:", err);
    res.status(500).json({ message: "Failed to fetch feedback history" });
  }
};
