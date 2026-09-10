import { memoryStore, MockObjectId, toObjectId } from "./memoryStore.js";

function getNested(obj, path) {
  return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
}

function matchValue(actual, expected) {
  if (expected === undefined) return true;
  if (expected && typeof expected === "object" && !(expected instanceof Date) && !(expected instanceof MockObjectId)) {
    if ("$ne" in expected) {
      const exp = expected.$ne;
      if (exp && (exp instanceof MockObjectId || typeof exp === "string")) {
        return !toObjectId(actual)?.equals(toObjectId(exp));
      }
      return actual !== exp;
    }
    if ("$nin" in expected) {
      const list = expected.$nin.map((x) => toObjectId(x)?.toString());
      const actList = Array.isArray(actual) ? actual.map((x) => toObjectId(x)?.toString()) : [toObjectId(actual)?.toString()];
      return !actList.some((x) => list.includes(x));
    }
    if ("$in" in expected) {
      const list = expected.$in.map((x) => toObjectId(x)?.toString());
      const actList = Array.isArray(actual) ? actual.map((x) => toObjectId(x)?.toString()) : [toObjectId(actual)?.toString()];
      return actList.some((x) => list.includes(x));
    }
    if ("$gt" in expected) {
      return actual > expected.$gt;
    }
    if ("$lt" in expected) {
      return actual < expected.$lt;
    }
    if ("$gte" in expected) {
      return actual >= expected.$gte;
    }
    if ("$lte" in expected) {
      return actual <= expected.$lte;
    }
  }

  if (Array.isArray(actual)) {
    if (expected instanceof MockObjectId || typeof expected === "string") {
      return actual.some((item) => toObjectId(item)?.equals(toObjectId(expected)));
    }
    return actual.includes(expected);
  }

  if (expected instanceof MockObjectId || actual instanceof MockObjectId) {
    return toObjectId(actual)?.equals(toObjectId(expected));
  }

  return actual === expected;
}

export function matchFilter(item, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;

  if (filter.$and && Array.isArray(filter.$and)) {
    if (!filter.$and.every((f) => matchFilter(item, f))) return false;
  }

  if (filter.$or && Array.isArray(filter.$or)) {
    if (!filter.$or.some((f) => matchFilter(item, f))) return false;
  }

  for (const [key, expected] of Object.entries(filter)) {
    if (key === "$and" || key === "$or") continue;
    const actual = getNested(item, key);
    if (!matchValue(actual, expected)) return false;
  }

  return true;
}

export function applySelectToDoc(doc, selectStr) {
  if (!doc || !selectStr || typeof selectStr !== "string") return doc;
  const parts = selectStr.trim().split(/\s+/);
  const isExclude = parts.every((p) => p.startsWith("-"));
  const copy = { ...doc };

  if (isExclude) {
    for (const p of parts) {
      const field = p.substring(1);
      delete copy[field];
    }
    return copy;
  } else {
    const keep = { _id: copy._id };
    for (const p of parts) {
      keep[p] = copy[p];
    }
    return keep;
  }
}

export function applyPopulateToItem(item, field, selectStr) {
  if (!item) return item;
  const copy = { ...item };

  if (field === "senderId") {
    const senderId = toObjectId(copy.senderId);
    const user = memoryStore.users.find((u) => toObjectId(u._id).equals(senderId));
    copy.senderId = user
      ? { _id: user._id, fullName: user.fullName, profilePic: user.profilePic || "" }
      : { _id: senderId, fullName: "User", profilePic: "" };
  } else if (field === "receiverId") {
    const receiverId = toObjectId(copy.receiverId);
    const user = memoryStore.users.find((u) => toObjectId(u._id).equals(receiverId));
    copy.receiverId = user
      ? { _id: user._id, fullName: user.fullName, profilePic: user.profilePic || "" }
      : null;
  } else if (field === "members") {
    copy.members = (copy.members || []).map((m) => {
      const mId = toObjectId(m);
      const user = memoryStore.users.find((u) => toObjectId(u._id).equals(mId));
      return user
        ? { _id: user._id, fullName: user.fullName, profilePic: user.profilePic || "" }
        : { _id: mId, fullName: "User", profilePic: "" };
    });
  } else if (field === "owner") {
    const ownerId = toObjectId(copy.owner);
    const user = memoryStore.users.find((u) => toObjectId(u._id).equals(ownerId));
    copy.owner = user
      ? { _id: user._id, fullName: user.fullName, profilePic: user.profilePic || "" }
      : { _id: ownerId, fullName: "Owner", profilePic: "" };
  } else if (field === "pinnedBy") {
    if (!copy.pinnedBy) {
      copy.pinnedBy = null;
    } else {
      const pinnedById = toObjectId(copy.pinnedBy);
      const user = memoryStore.users.find((u) => toObjectId(u._id).equals(pinnedById));
      copy.pinnedBy = user
        ? { _id: user._id, fullName: user.fullName, profilePic: user.profilePic || "" }
        : { _id: pinnedById, fullName: "User", profilePic: "" };
    }
  }

  return attachDocMethods(copy);
}

export function attachDocMethods(doc, collectionName) {
  if (!doc || typeof doc !== "object") return doc;

  if (doc._id) {
    doc._id = toObjectId(doc._id);
  }

  doc.equals = function (other) {
    return toObjectId(this._id).equals(toObjectId(other));
  };

  doc.save = async function () {
    if (!collectionName) return this;
    const list = memoryStore[collectionName];
    if (!list) return this;
    const idx = list.findIndex((item) => toObjectId(item._id).equals(this._id));
    this.updatedAt = new Date();
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...this };
    } else {
      list.push(this);
    }
    return this;
  };

  doc.populate = async function (field, select) {
    const populated = applyPopulateToItem(this, field, select);
    Object.assign(this, populated);
    return this;
  };

  return doc;
}

export class MemoryQuery {
  constructor(executor) {
    this._executor = executor;
    this._selectStr = null;
    this._sortObj = null;
    this._limitCount = null;
    this._populates = [];
  }

  select(str) {
    this._selectStr = str;
    return this;
  }

  sort(sortObj) {
    this._sortObj = sortObj;
    return this;
  }

  limit(n) {
    this._limitCount = n;
    return this;
  }

  populate(field, select) {
    this._populates.push({ field, select });
    return this;
  }

  async then(onFulfilled, onRejected) {
    try {
      let res = await this._executor();

      if (Array.isArray(res)) {
        // Populates
        for (const { field, select } of this._populates) {
          res = res.map((item) => applyPopulateToItem(item, field, select));
        }
        // Sort
        if (this._sortObj) {
          for (const [key, dir] of Object.entries(this._sortObj)) {
            res.sort((a, b) => {
              const valA = new Date(a[key] || 0).getTime() || a[key];
              const valB = new Date(b[key] || 0).getTime() || b[key];
              return dir === 1 || dir === "asc" ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
            });
          }
        }
        // Limit
        if (this._limitCount) {
          res = res.slice(0, this._limitCount);
        }
        // Select
        if (this._selectStr) {
          res = res.map((item) => applySelectToDoc(item, this._selectStr));
        }
      } else if (res && typeof res === "object") {
        for (const { field, select } of this._populates) {
          res = applyPopulateToItem(res, field, select);
        }
        if (this._selectStr) {
          res = applySelectToDoc(res, this._selectStr);
        }
      }

      return Promise.resolve(res).then(onFulfilled, onRejected);
    } catch (err) {
      if (onRejected) return onRejected(err);
      throw err;
    }
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }
}
