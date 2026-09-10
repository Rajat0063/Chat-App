import bcrypt from "bcryptjs";

// Helper class for MongoDB-like ObjectId
export class MockId {
  constructor(id) {
    if (id instanceof MockId) {
      this.val = id.val;
    } else if (id && typeof id === "object" && id._id) {
      const inner = id._id;
      this.val = inner instanceof MockId ? inner.val : String(inner);
    } else if (typeof id === "string" && id.length > 0) {
      this.val = id;
    } else if (id && typeof id === "object" && typeof id.toString === "function" && id.toString() !== "[object Object]") {
      this.val = id.toString();
    } else if (!id) {
      this.val = "";
    } else {
      this.val = "mock_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    }
  }

  toString() {
    return this.val;
  }

  equals(other) {
    if (other === null || other === undefined) return false;
    let otherStr;
    if (other instanceof MockId) {
      otherStr = other.val;
    } else if (other && typeof other === "object" && other._id) {
      const inner = other._id;
      otherStr = inner instanceof MockId ? inner.val : String(inner);
    } else if (typeof other === "string") {
      otherStr = other;
    } else if (typeof other?.toString === "function" && other.toString() !== "[object Object]") {
      otherStr = other.toString();
    } else {
      otherStr = String(other);
    }
    return Boolean(this.val && otherStr && this.val === otherStr);
  }

  toJSON() {
    return this.val;
  }
}

export const toId = (val) => {
  if (val === null || val === undefined) return null;
  if (val instanceof MockId) return val;
  if (val && typeof val === "object" && val._id) return toId(val._id);
  return new MockId(val);
};

export const idEquals = (a, b) => {
  if (a === null && b === null) return true;
  if (a === undefined && b === undefined) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;
  const idA = toId(a);
  const idB = toId(b);
  if (!idA || !idB) return false;
  return idA.equals(idB);
};

// Pre-generated bcrypt hashes for password "123456"
const DEFAULT_HASHED_PASS = "$2a$10$wT8m9M3.a2k8aJgq8vK.veaYF0eK7DqYgB6f5mCgH4E2a1b3c4d5e";
let initializedPasswordHash = "";

const getHashedPass = async () => {
  if (!initializedPasswordHash) {
    try {
      const salt = await bcrypt.genSalt(10);
      initializedPasswordHash = await bcrypt.hash("123456", salt);
    } catch {
      initializedPasswordHash = DEFAULT_HASHED_PASS;
    }
  }
  return initializedPasswordHash;
};

// In-memory collections
export const memoryData = {
  users: [],
  messages: [],
  groups: [],
  otps: [],
  feedbacks: [],
};

// Seed initial memory data
export const initMemoryStore = async () => {
  if (memoryData.users.length > 0) return;

  const pass = await getHashedPass();
  const rajatId = new MockId("660000000000000000000001");
  const abhinavId = new MockId("660000000000000000000002");
  const testUserId = new MockId("660000000000000000000003");

  const rajat = createDoc({
    _id: rajatId,
    fullName: "Rajat Yadav",
    email: "rajat@example.com",
    password: pass,
    isVerified: true,
    profilePic: "/avatar.png",
    about: "Hey there! I am using Chatty.",
    blockedUsers: [],
    verificationOtp: "",
    verificationOtpExpires: null,
    resetOtp: "",
    resetOtpExpires: null,
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  }, "users");

  const abhinav = createDoc({
    _id: abhinavId,
    fullName: "Abhinav Sharma",
    email: "abhinav@example.com",
    password: pass,
    isVerified: true,
    profilePic: "",
    about: "Building something cool.",
    blockedUsers: [],
    verificationOtp: "",
    verificationOtpExpires: null,
    resetOtp: "",
    resetOtpExpires: null,
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  }, "users");

  const testUser = createDoc({
    _id: testUserId,
    fullName: "Test User",
    email: "test@example.com",
    password: pass,
    isVerified: true,
    profilePic: "",
    about: "Testing real-time features on Chatty.",
    blockedUsers: [],
    verificationOtp: "",
    verificationOtpExpires: null,
    resetOtp: "",
    resetOtpExpires: null,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  }, "users");

  memoryData.users.push(rajat, abhinav, testUser);

  // Messages
  const m1 = createDoc({
    _id: new MockId("660000000000000000000011"),
    senderId: rajatId,
    receiverId: abhinavId,
    groupId: null,
    text: "Hey Abhinav, how are you?",
    image: "",
    status: "read",
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 3.8),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 3.9),
    readBy: [rajatId, abhinavId],
    deletedFor: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
  }, "messages");

  const m2 = createDoc({
    _id: new MockId("660000000000000000000012"),
    senderId: abhinavId,
    receiverId: rajatId,
    groupId: null,
    text: "I am good! Want to catch up later on Chatty?",
    image: "",
    status: "read",
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 2.8),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 2.9),
    readBy: [abhinavId, rajatId],
    deletedFor: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
  }, "messages");

  const m3 = createDoc({
    _id: new MockId("660000000000000000000013"),
    senderId: rajatId,
    receiverId: testUserId,
    groupId: null,
    text: "Hi Test User, welcome to Chatty!",
    image: "",
    status: "read",
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 1.8),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 1.9),
    readBy: [rajatId, testUserId],
    deletedFor: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  }, "messages");

  const m4 = createDoc({
    _id: new MockId("660000000000000000000014"),
    senderId: testUserId,
    receiverId: rajatId,
    groupId: null,
    text: "Thanks! Real-time messaging and themes work great.",
    image: "",
    status: "read",
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 0.8),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 0.9),
    readBy: [testUserId, rajatId],
    deletedFor: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
  }, "messages");

  memoryData.messages.push(m1, m2, m3, m4);

  const m5 = createDoc({
    _id: new MockId("660000000000000000000015"),
    senderId: abhinavId,
    receiverId: rajatId,
    text: "Hey Rajat, welcome back! The real-time messaging is configured.",
    image: "",
    groupId: null,
    deletedFor: [],
    seen: true,
    seenAt: new Date(Date.now() - 3600000),
    seenBy: [rajatId],
    status: "read",
    readAt: new Date(Date.now() - 3600000),
    readBy: [rajatId],
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000),
  }, "messages");

  const m6 = createDoc({
    _id: new MockId("660000000000000000000016"),
    senderId: rajatId,
    receiverId: abhinavId,
    text: "Awesome! Testing socket events and image sharing.",
    image: "",
    groupId: null,
    deletedFor: [],
    seen: true,
    seenAt: new Date(Date.now() - 2500000),
    seenBy: [abhinavId],
    status: "read",
    readAt: new Date(Date.now() - 2500000),
    readBy: [abhinavId],
    createdAt: new Date(Date.now() - 2700000),
    updatedAt: new Date(Date.now() - 2500000),
  }, "messages");

  const m7 = createDoc({
    _id: new MockId("660000000000000000000017"),
    senderId: abhinavId,
    receiverId: rajatId,
    text: "Did you check out the new group chat and unread badge features?",
    image: "",
    groupId: null,
    deletedFor: [],
    seen: false,
    seenAt: null,
    seenBy: [],
    status: "delivered",
    deliveredAt: new Date(Date.now() - 1200000),
    readBy: [],
    createdAt: new Date(Date.now() - 1200000),
    updatedAt: new Date(Date.now() - 1200000),
  }, "messages");

  const m8 = createDoc({
    _id: new MockId("660000000000000000000018"),
    senderId: abhinavId,
    receiverId: rajatId,
    text: "Let me know what you think!",
    image: "",
    groupId: null,
    deletedFor: [],
    seen: false,
    seenAt: null,
    seenBy: [],
    status: "sent",
    deliveredAt: null,
    readBy: [],
    createdAt: new Date(Date.now() - 600000),
    updatedAt: new Date(Date.now() - 600000),
  }, "messages");

  const m9 = createDoc({
    _id: new MockId("660000000000000000000019"),
    senderId: testUserId,
    receiverId: rajatId,
    text: "Hey Rajat! Just dropped by to test the app.",
    image: "",
    groupId: null,
    deletedFor: [],
    seen: false,
    seenAt: null,
    seenBy: [],
    status: "sent",
    deliveredAt: null,
    readBy: [],
    createdAt: new Date(Date.now() - 300000),
    updatedAt: new Date(Date.now() - 300000),
  }, "messages");

  const m10 = createDoc({
    _id: new MockId("660000000000000000000020"),
    senderId: abhinavId,
    receiverId: null,
    groupId: groupId,
    text: "Welcome everyone to Chatty Dev Community! Feel free to share your thoughts.",
    image: "",
    deletedFor: [],
    seen: false,
    seenAt: null,
    seenBy: [abhinavId],
    status: "delivered",
    deliveredAt: new Date(Date.now() - 900000),
    readBy: [abhinavId],
    createdAt: new Date(Date.now() - 900000),
    updatedAt: new Date(Date.now() - 900000),
  }, "messages");

  memoryData.messages.push(m5, m6, m7, m8, m9, m10);

  // Demo Group
  const groupId = new MockId("660000000000000000000021");
  const demoGroup = createDoc({
    _id: groupId,
    name: "Chatty Community",
    owner: rajatId,
    members: [rajatId, abhinavId, testUserId],
    avatar: "",
    description: "Welcome to the official Chatty community room!",
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  }, "groups");

  memoryData.groups.push(demoGroup);

  const gm1 = createDoc({
    _id: new MockId("660000000000000000000031"),
    senderId: rajatId,
    receiverId: null,
    groupId: groupId,
    text: "Welcome everyone to the Chatty Community group!",
    image: "",
    status: "read",
    deliveredAt: new Date(Date.now() - 1000 * 60 * 29),
    readBy: [rajatId, abhinavId, testUserId],
    deletedFor: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  }, "messages");

  memoryData.messages.push(gm1);

  console.log("✅ In-memory database initialized with seeded users, messages, and community group.");
};

// Document factory with save() and deleteOne()
export function createDoc(data, collectionName) {
  const doc = {
    ...data,
    _id: toId(data._id),
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };

  // Attach methods
  doc.save = async function () {
    this.updatedAt = new Date();
    const list = memoryData[collectionName];
    if (list) {
      const idx = list.findIndex((item) => item._id.equals(this._id));
      if (idx !== -1) {
        list[idx] = this;
      } else {
        list.push(this);
      }
    }
    return this;
  };

  doc.deleteOne = async function () {
    const list = memoryData[collectionName];
    if (list) {
      const idx = list.findIndex((item) => item._id.equals(this._id));
      if (idx !== -1) list.splice(idx, 1);
    }
    return { acknowledged: true, deletedCount: 1 };
  };

  return doc;
}

// Chainable Query Helper
class QueryPromise {
  constructor(resolver) {
    this.resolver = resolver;
    this._selectFields = null;
    this._populatePaths = [];
    this._sortObj = null;
  }

  select(fields) {
    this._selectFields = fields;
    return this;
  }

  populate(path, fields) {
    this._populatePaths.push({ path, fields });
    return this;
  }

  sort(sortObj) {
    this._sortObj = sortObj;
    return this;
  }

  async exec() {
    let result = await this.resolver();
    if (result === null || result === undefined) return result;

    const applyTransforms = (item) => {
      if (!item) return item;
      let cloned = { ...item };
      // Handle select
      if (typeof this._selectFields === "string") {
        const parts = this._selectFields.trim().split(/\s+/);
        const exclusions = parts.filter((p) => p.startsWith("-")).map((p) => p.substring(1));
        const inclusions = parts.filter((p) => !p.startsWith("-") && p.length > 0);

        if (exclusions.length > 0) {
          exclusions.forEach((field) => delete cloned[field]);
        } else if (inclusions.length > 0) {
          const filtered = { _id: cloned._id };
          inclusions.forEach((field) => {
            if (field in cloned) filtered[field] = cloned[field];
          });
          cloned = filtered;
        }
      }

      // Handle populate
      for (const pop of this._populatePaths) {
        const path = pop.path;
        const targetVal = cloned[path];
        if (targetVal) {
          if (Array.isArray(targetVal)) {
            cloned[path] = targetVal.map((id) => {
              const u = memoryData.users.find((u) => u._id.equals(id));
              if (u) {
                return {
                  _id: u._id,
                  fullName: u.fullName,
                  profilePic: u.profilePic,
                  email: u.email,
                };
              }
              return id;
            });
          } else {
            const u = memoryData.users.find((u) => u._id.equals(targetVal));
            if (u) {
              cloned[path] = {
                _id: u._id,
                fullName: u.fullName,
                profilePic: u.profilePic,
                email: u.email,
              };
            }
          }
        }
      }

      // Preserve methods
      cloned.save = item.save;
      cloned.deleteOne = item.deleteOne;
      return cloned;
    };

    if (Array.isArray(result)) {
      if (this._sortObj) {
        const [field, dir] = Object.entries(this._sortObj)[0] || [];
        if (field) {
          result.sort((a, b) => {
            const av = a[field] instanceof Date ? a[field].getTime() : a[field];
            const bv = b[field] instanceof Date ? b[field].getTime() : b[field];
            return dir === 1 || dir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
          });
        }
      }
      return result.map(applyTransforms);
    } else {
      return applyTransforms(result);
    }
  }

  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.exec().catch(onRejected);
  }
}

// Model wrapper for Memory Store
export const createMemoryModel = (collectionName) => {
  return {
    find: (query = {}) => {
      return new QueryPromise(async () => {
        const items = memoryData[collectionName] || [];
        return items.filter((item) => matchQuery(item, query));
      });
    },

    findOne: (query = {}) => {
      return new QueryPromise(async () => {
        const items = memoryData[collectionName] || [];
        const found = items.find((item) => matchQuery(item, query));
        return found || null;
      });
    },

    findById: (id) => {
      return new QueryPromise(async () => {
        if (!id) return null;
        const targetId = toId(id);
        const items = memoryData[collectionName] || [];
        const found = items.find((item) => item._id.equals(targetId));
        return found || null;
      });
    },

    findByIdAndUpdate: (id, update = {}, options = {}) => {
      return new QueryPromise(async () => {
        if (!id) return null;
        const targetId = toId(id);
        const items = memoryData[collectionName] || [];
        const item = items.find((item) => item._id.equals(targetId));
        if (!item) return null;
        Object.assign(item, update);
        item.updatedAt = new Date();
        return item;
      });
    },

    findByIdAndDelete: (id) => {
      return new QueryPromise(async () => {
        if (!id) return null;
        const targetId = toId(id);
        const items = memoryData[collectionName] || [];
        const idx = items.findIndex((item) => item._id.equals(targetId));
        if (idx !== -1) {
          const removed = items.splice(idx, 1)[0];
          return removed;
        }
        return null;
      });
    },

    create: async (docData) => {
      const doc = createDoc(docData, collectionName);
      memoryData[collectionName].push(doc);
      return doc;
    },

    insertMany: async (docs) => {
      const created = docs.map((d) => createDoc(d, collectionName));
      memoryData[collectionName].push(...created);
      return created;
    },

    countDocuments: async (query = {}) => {
      const items = memoryData[collectionName] || [];
      return items.filter((item) => matchQuery(item, query)).length;
    },

    deleteMany: async (query = {}) => {
      const items = memoryData[collectionName] || [];
      const remaining = items.filter((item) => !matchQuery(item, query));
      const deletedCount = items.length - remaining.length;
      memoryData[collectionName] = remaining;
      return { acknowledged: true, deletedCount };
    },

    updateMany: async (query = {}, update = {}) => {
      const items = memoryData[collectionName] || [];
      let modifiedCount = 0;
      for (const item of items) {
        if (matchQuery(item, query)) {
          if (update.$set) {
            for (const [key, val] of Object.entries(update.$set)) {
              item[key] = val;
            }
          }
          if (update.$addToSet) {
            for (const [key, val] of Object.entries(update.$addToSet)) {
              if (!Array.isArray(item[key])) {
                item[key] = [];
              }
              const valId = toId(val);
              if (valId && !item[key].some((k) => idEquals(k, valId))) {
                item[key].push(valId);
              }
            }
          }
          for (const [key, val] of Object.entries(update)) {
            if (!key.startsWith("$")) {
              item[key] = val;
            }
          }
          item.updatedAt = new Date();
          modifiedCount++;
        }
      }
      return { acknowledged: true, modifiedCount };
    },
  };
};

// Simple MongoDB-like query matcher
function matchQuery(item, query) {
  if (!query || Object.keys(query).length === 0) return true;

  for (const [key, val] of Object.entries(query)) {
    if (key === "$and") {
      if (!Array.isArray(val) || !val.every((q) => matchQuery(item, q))) return false;
      continue;
    }
    if (key === "$or") {
      if (!Array.isArray(val) || !val.some((q) => matchQuery(item, q))) return false;
      continue;
    }

    const itemVal = item[key];

    if (val && typeof val === "object" && !val._id && !(val instanceof Date) && !(val instanceof MockId)) {
      // Operator check
      if ("$ne" in val) {
        const neVal = val.$ne;
        if (typeof neVal === "string" && !neVal.startsWith("6600") && !neVal.startsWith("mock_")) {
          if (itemVal === neVal) return false;
        } else {
          if (idEquals(itemVal, neVal)) return false;
        }
      }
      if ("$nin" in val && Array.isArray(val.$nin)) {
        if (Array.isArray(itemVal)) {
          if (val.$nin.some((v) => itemVal.some((iv) => idEquals(iv, v)))) return false;
        } else {
          if (val.$nin.some((v) => idEquals(itemVal, v))) return false;
        }
      }
      if ("$all" in val && Array.isArray(val.$all)) {
        if (!Array.isArray(itemVal)) return false;
        if (!val.$all.every((v) => itemVal.some((iv) => idEquals(iv, v)))) return false;
      }
      if ("$in" in val && Array.isArray(val.$in)) {
        if (!val.$in.some((v) => idEquals(itemVal, v))) return false;
      }
      continue;
    }

    // Direct comparison
    if (key === "_id" || key === "senderId" || key === "receiverId" || key === "groupId" || key === "owner") {
      if (!idEquals(itemVal, val)) return false;
    } else if (key === "members" && Array.isArray(itemVal)) {
      if (!itemVal.some((m) => idEquals(m, val))) return false;
    } else {
      if (itemVal !== val) return false;
    }
  }

  return true;
}
