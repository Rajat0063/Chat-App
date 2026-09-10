import mongoose from "mongoose";
import { initMemoryStore } from "./memoryStore.js";

const initMemoryDb = async () => {
  try {
    await initMemoryStore();
  } catch (err) {
    console.warn("⚠️ In-memory fallback init warning:", err.message);
  }
};

export const connectDB = async () => {
  // Always initialize in-memory fallback first for immediate responsiveness
  await initMemoryDb();

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.warn("⚠️ No MONGO_URI provided in environment. Using robust in-memory database.");
      return;
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    await ensureMongoDemoUsers();
  } catch (err) {
    console.warn(`⚠️ MongoDB connection error: ${err.message}. Using robust in-memory database.`);
  }
};

async function ensureMongoDemoUsers() {
  try {
    const usersCol = mongoose.connection.db.collection("users");

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
}

export { initMemoryDb };