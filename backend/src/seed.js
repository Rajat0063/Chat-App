import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/UserModel.js";
import Message from "./models/MessageModel.js";

dotenv.config();

const seedData = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB for seeding");

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("Database already has users. Skipping seed.");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);

    const users = await User.insertMany([
      {
        fullName: "Rajat Yadav",
        email: "rajat@example.com",
        password: await bcrypt.hash("123456", salt),
        isVerified: true,
        profilePic: "",
        about: "Hello! I am Rajat.",
      },
      {
        fullName: "Abhinav",
        email: "abhinav@example.com",
        password: await bcrypt.hash("123456", salt),
        isVerified: true,
        profilePic: "",
        about: "Building something cool.",
      },
      {
        fullName: "Test User",
        email: "test@example.com",
        password: await bcrypt.hash("123456", salt),
        isVerified: true,
        profilePic: "",
        about: "Testing chat features.",
      },
    ]);

    const [rajat, abhinav, testUser] = users;

    await Message.insertMany([
      {
        senderId: rajat._id,
        receiverId: abhinav._id,
        text: "Hey Abhinav, how are you?",
      },
      {
        senderId: abhinav._id,
        receiverId: rajat._id,
        text: "I am good! Want to catch up later?",
      },
      {
        senderId: rajat._id,
        receiverId: testUser._id,
        text: "Hi Test User, welcome to Chatty.",
      },
      {
        senderId: testUser._id,
        receiverId: rajat._id,
        text: "Thanks! The app looks great.",
      },
    ]);

    console.log("✅ Seeded demo users and messages");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seedData();
