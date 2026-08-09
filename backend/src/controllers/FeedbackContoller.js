import Feedback from "../models/FeedbackModel.js";

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
