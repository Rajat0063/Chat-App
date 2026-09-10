import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { initMemoryDb } from "./memoryStore.js";

export const isMongoConnected = () => mongoose.connection.readyState === 1;

const ensureMongoDemoUsers = async () => {
  try {
    const usersCol = mongoose.connection.db.collection("users");
    const hash = await bcrypt.hash("123456", 10);
    const demos = [
      {
        fullName: "Rajat Yadav",
        email: "rajat@example.com",
        password: hash,
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajat",
        isVerified: true,
        about: "Hello! I am Rajat, creator of Chatty.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fullName: "Abhinav",
        email: "abhinav@example.com",
        password: hash,
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abhinav",
        isVerified: true,
        about: "Building real-time apps.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fullName: "Test User",
        email: "test@example.com",
        password: hash,
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=TestUser",
        isVerified: true,
        about: "Testing chat features and themes.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const d of demos) {
      const existing = await usersCol.findOne({ email: d.email });
      if (!existing) {
        await usersCol.insertOne(d);
      } else if (!existing.isVerified) {
        await usersCol.updateOne({ email: d.email }, { $set: { isVerified: true } });
      }
    }

    // Ensure sample unread messages exist for demo users so badges are visible
    const rajat = await usersCol.findOne({ email: "rajat@example.com" });
    const abhinav = await usersCol.findOne({ email: "abhinav@example.com" });
    const testUser = await usersCol.findOne({ email: "test@example.com" });

    if (rajat && abhinav && testUser) {
      const msgsCol = mongoose.connection.db.collection("messages");
      const existingUnread = await msgsCol.findOne({
        receiverId: rajat._id,
        seen: { $ne: true },
      });
      if (!existingUnread) {
        await msgsCol.insertMany([
          {
            senderId: abhinav._id,
            receiverId: rajat._id,
            text: "Hey Rajat, have you checked the new project guidelines?",
            seen: false,
            seenBy: [],
            deletedFor: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            senderId: abhinav._id,
            receiverId: rajat._id,
            text: "Let me know when you are free for a quick sync!",
            seen: false,
            seenBy: [],
            deletedFor: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            senderId: testUser._id,
            receiverId: rajat._id,
            text: "Testing unread count badge display on sidebar!",
            seen: false,
            seenBy: [],
            deletedFor: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }

      const groupsCol = mongoose.connection.db.collection("groups");
      let devGroup = await groupsCol.findOne({ name: "Dev Core Team" });
      if (!devGroup) {
        const res = await groupsCol.insertOne({
          name: "Dev Core Team",
          description: "Official engineering and dev channel",
          owner: abhinav._id,
          members: [rajat._id, abhinav._id, testUser._id],
          avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=DevCore",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        devGroup = { _id: res.insertedId };
      }
      const groupUnread = await msgsCol.findOne({
        groupId: devGroup._id,
        seenBy: { $nin: [rajat._id] },
      });
      if (!groupUnread) {
        await msgsCol.insertOne({
          groupId: devGroup._id,
          senderId: abhinav._id,
          text: "Sprint retrospective meeting at 4 PM today!",
          seenBy: [abhinav._id],
          deletedFor: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  } catch (err) {
    console.warn("⚠️ Demo users check in Mongo warning:", err.message);
  }
};

export const connectDB = async () => {
  // Ensure in-memory store is initialized immediately so app is always functional
  try {
    await initMemoryDb();
  } catch (e) {
    console.warn("Memory store init warning:", e);
  }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.log("ℹ️ MONGO_URI not provided — using in-memory store with demo users.");
    return;
  }
  try {
    mongoose.set("bufferCommands", false);
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    await ensureMongoDemoUsers();
  } catch (err) {
    console.warn("⚠️ MongoDB connection failed (falling back to in-memory store):", err?.message || err);
  }
};
