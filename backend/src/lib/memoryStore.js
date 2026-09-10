import bcrypt from "bcryptjs";

export class MockObjectId {
  constructor(id) {
    this._id = id ? (typeof id === "object" && id._id ? id._id.toString() : id.toString()) : "id_" + Math.random().toString(36).substring(2, 12);
  }
  toString() { return this._id; }
  valueOf() { return this._id; }
  toJSON() { return this._id; }
  equals(other) {
    if (!other) return false;
    const otherStr = typeof other === "object" && other._id ? other._id.toString() : other.toString();
    return this._id === otherStr;
  }
}

export const toObjectId = (val) => {
  if (!val) return null;
  if (val instanceof MockObjectId) return val;
  return new MockObjectId(val);
};

// In-memory collections
export const memoryStore = {
  users: [],
  messages: [],
  groups: [],
  otps: [],
  feedbacks: [],
  initialized: false,
};

// Pre-seed demo users
export const initMemoryDb = async () => {
  if (memoryStore.initialized) return;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);

    const rajatId = new MockObjectId("user_rajat_001");
    const abhinavId = new MockObjectId("user_abhinav_002");
    const testUserId = new MockObjectId("user_test_003");

    memoryStore.users = [
      {
        _id: rajatId,
        fullName: "Rajat Yadav",
        email: "rajat@example.com",
        password: hashedPassword,
        isVerified: true,
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajat",
        about: "Hello! I am Rajat, creator of Chatty.",
        lastSeen: new Date(),
        blockedUsers: [],
        verificationOtp: "",
        resetOtp: "",
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(),
      },
      {
        _id: abhinavId,
        fullName: "Abhinav",
        email: "abhinav@example.com",
        password: hashedPassword,
        isVerified: true,
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abhinav",
        about: "Building real-time apps.",
        lastSeen: new Date(),
        blockedUsers: [],
        verificationOtp: "",
        resetOtp: "",
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(),
      },
      {
        _id: testUserId,
        fullName: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        isVerified: true,
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=TestUser",
        about: "Testing chat features and themes.",
        lastSeen: new Date(),
        blockedUsers: [],
        verificationOtp: "",
        resetOtp: "",
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(),
      },
    ];

    const groupId = new MockObjectId("group_001");

    memoryStore.messages = [
      {
        _id: new MockObjectId("msg_001"),
        senderId: rajatId,
        receiverId: abhinavId,
        text: "Hey Abhinav! Welcome to the new Chatty app.",
        image: "",
        groupId: null,
        deletedFor: [],
        seen: true,
        seenAt: new Date(Date.now() - 3550000),
        seenBy: [abhinavId],
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 3600000),
      },
      {
        _id: new MockObjectId("msg_002"),
        senderId: abhinavId,
        receiverId: rajatId,
        text: "Hey Rajat! The real-time messaging is so smooth.",
        image: "",
        groupId: null,
        deletedFor: [],
        seen: true,
        seenAt: new Date(Date.now() - 3450000),
        seenBy: [rajatId],
        createdAt: new Date(Date.now() - 3500000),
        updatedAt: new Date(Date.now() - 3500000),
      },
      {
        _id: new MockObjectId("msg_003"),
        senderId: abhinavId,
        receiverId: rajatId,
        text: "Did you check out the new group chat and unread badge features?",
        image: "",
        groupId: null,
        deletedFor: [],
        seen: false,
        seenAt: null,
        seenBy: [],
        createdAt: new Date(Date.now() - 1200000),
        updatedAt: new Date(Date.now() - 1200000),
      },
      {
        _id: new MockObjectId("msg_004"),
        senderId: abhinavId,
        receiverId: rajatId,
        text: "Let me know what you think!",
        image: "",
        groupId: null,
        deletedFor: [],
        seen: false,
        seenAt: null,
        seenBy: [],
        createdAt: new Date(Date.now() - 600000),
        updatedAt: new Date(Date.now() - 600000),
      },
      {
        _id: new MockObjectId("msg_005"),
        senderId: testUserId,
        receiverId: rajatId,
        text: "Hey Rajat! Just dropped by to test the app.",
        image: "",
        groupId: null,
        deletedFor: [],
        seen: false,
        seenAt: null,
        seenBy: [],
        createdAt: new Date(Date.now() - 300000),
        updatedAt: new Date(Date.now() - 300000),
      },
      {
        _id: new MockObjectId("msg_006"),
        senderId: abhinavId,
        receiverId: null,
        groupId: groupId,
        text: "Welcome everyone to Chatty Dev Community! Feel free to share your thoughts.",
        image: "",
        deletedFor: [],
        seen: false,
        seenAt: null,
        seenBy: [abhinavId],
        createdAt: new Date(Date.now() - 900000),
        updatedAt: new Date(Date.now() - 900000),
      },
    ];

    memoryStore.groups = [
      {
        _id: groupId,
        name: "Chatty Dev Community",
        owner: rajatId,
        members: [rajatId, abhinavId, testUserId],
        avatar: "",
        description: "Official community room for Chatty announcements and feedback.",
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(),
      },
    ];

    memoryStore.initialized = true;
    console.log("✅ In-memory database initialized with demo users (rajat@example.com / 123456, abhinav@example.com / 123456, test@example.com / 123456)");
  } catch (err) {
    console.error("In-memory init error:", err);
  }
};

export function createMemoryModel(collectionName) {
  const collection = () => memoryStore[collectionName] || [];
  const idMatches = (docId, target) => {
    const a = (docId && docId._id ? docId._id : docId)?.toString?.();
    const b = (target && target._id ? target._id : target)?.toString?.();
    return a === b;
  };

  return {
    async create(doc) {
      const { attachDocMethods } = await import("./modelHelper.js");
      const item = { ...doc };
      if (!item._id) item._id = new MockObjectId(`${collectionName}_${Date.now()}_${Math.random().toString(16).slice(2)}`);
      item.createdAt ??= new Date();
      item.updatedAt ??= new Date();
      collection().push(item);
      return attachDocMethods({ ...item }, collectionName);
    },

    find(filter = {}) {
      return new (class {
        constructor(executor) {
          this._executor = executor;
        }

        select(str) { return this; }
        sort() { return this; }
        limit() { return this; }
        populate() { return this; }

        async then(onFulfilled, onRejected) {
          try {
            const result = await this._executor();
            return typeof onFulfilled === "function" ? onFulfilled(result) : result;
          } catch (err) {
            if (typeof onRejected === "function") return onRejected(err);
            throw err;
          }
        }
      })(async () => {
        const { matchFilter, attachDocMethods } = await import("./modelHelper.js");
        return collection().filter((item) => matchFilter(item, filter)).map((item) => attachDocMethods({ ...item }, collectionName));
      });
    },

    findOne(filter = {}) {
      return (async () => {
        const { matchFilter, attachDocMethods } = await import("./modelHelper.js");
        const found = collection().find((item) => matchFilter(item, filter));
        return found ? attachDocMethods({ ...found }, collectionName) : null;
      })();
    },

    findById(id) {
      return (async () => {
        const { attachDocMethods } = await import("./modelHelper.js");
        const target = id && id._id ? id._id : id;
        const found = collection().find((item) => idMatches(item._id, target));
        return found ? attachDocMethods({ ...found }, collectionName) : null;
      })();
    },

    async findByIdAndUpdate(id, update, options = {}) {
      const { attachDocMethods } = await import("./modelHelper.js");
      const target = id && id._id ? id._id : id;
      const index = collection().findIndex((item) => idMatches(item._id, target));
      if (index === -1) return options.new ? null : null;

      const existing = { ...collection()[index] };
      const patch = update && update.$set ? update.$set : update || {};
      const next = { ...existing, ...patch, updatedAt: new Date() };
      if (update && update.$addToSet) {
        for (const [key, value] of Object.entries(update.$addToSet)) {
          const arr = Array.isArray(next[key]) ? next[key] : [];
          const entry = Array.isArray(value) ? value : [value];
          const newVals = [...arr];
          for (const item of entry) {
            const encoded = item && item.toString ? item.toString() : item;
            if (!newVals.some((v) => (v && v.toString ? v.toString() : v) === encoded)) {
              newVals.push(item);
            }
          }
          next[key] = newVals;
        }
      }
      if (update && update.$pull) {
        for (const [key, value] of Object.entries(update.$pull)) {
          const arr = Array.isArray(next[key]) ? next[key] : [];
          next[key] = arr.filter((item) => {
            const itemVal = item && item.toString ? item.toString() : item;
            const targetVal = value && value.toString ? value.toString() : value;
            return itemVal !== targetVal;
          });
        }
      }

      collection()[index] = next;
      return options.new ? attachDocMethods({ ...next }, collectionName) : attachDocMethods({ ...existing }, collectionName);
    },

    async findByIdAndDelete(id) {
      const target = id && id._id ? id._id : id;
      const index = collection().findIndex((item) => idMatches(item._id, target));
      if (index === -1) return null;
      const [removed] = collection().splice(index, 1);
      const { attachDocMethods } = await import("./modelHelper.js");
      return attachDocMethods({ ...removed }, collectionName);
    },

    async updateMany(filter, update) {
      const { matchFilter } = await import("./modelHelper.js");
      let modified = 0;
      const docs = collection().filter((item) => matchFilter(item, filter));
      docs.forEach((doc) => {
        const index = collection().findIndex((item) => idMatches(item._id, doc._id));
        if (index === -1) return;
        const current = { ...collection()[index] };
        const next = { ...current, ...(update && update.$set ? update.$set : {}), updatedAt: new Date() };
        if (update && update.$addToSet) {
          Object.entries(update.$addToSet).forEach(([key, value]) => {
            const arr = Array.isArray(next[key]) ? next[key] : [];
            const incoming = Array.isArray(value) ? value : [value];
            const merged = [...arr];
            incoming.forEach((item) => {
              const token = item && item.toString ? item.toString() : item;
              if (!merged.some((v) => (v && v.toString ? v.toString() : v) === token)) merged.push(item);
            });
            next[key] = merged;
          });
        }
        if (update && update.$pull) {
          Object.entries(update.$pull).forEach(([key, value]) => {
            const arr = Array.isArray(next[key]) ? next[key] : [];
            next[key] = arr.filter((item) => (item && item.toString ? item.toString() : item) !== (value && value.toString ? value.toString() : value));
          });
        }
        collection()[index] = next;
        modified += 1;
      });
      return { acknowledged: true, modifiedCount: modified, matchedCount: docs.length };
    },

    async deleteMany(filter) {
      const { matchFilter } = await import("./modelHelper.js");
      const docs = collection().filter((item) => matchFilter(item, filter));
      docs.forEach((doc) => {
        const idx = collection().findIndex((item) => idMatches(item._id, doc._id));
        if (idx !== -1) collection().splice(idx, 1);
      });
      return { acknowledged: true, deletedCount: docs.length };
    },

    async deleteOne(filter) {
      const { matchFilter } = await import("./modelHelper.js");
      const idx = collection().findIndex((item) => matchFilter(item, filter));
      if (idx === -1) return { acknowledged: true, deletedCount: 0 };
      const [removed] = collection().splice(idx, 1);
      return { acknowledged: true, deletedCount: 1, deletedDoc: removed };
    },

    async countDocuments(filter = {}) {
      const { matchFilter } = await import("./modelHelper.js");
      return collection().filter((item) => matchFilter(item, filter)).length;
    },
  };
}
