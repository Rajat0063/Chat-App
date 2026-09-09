import mongoose from "mongoose";

export function createBridgeModel(mongooseModel, memoryModel) {
  return new Proxy(mongooseModel, {
    get(target, prop) {
      if (mongoose.connection.readyState === 1) {
        const val = target[prop];
        return typeof val === "function" ? val.bind(target) : val;
      }
      if (prop in memoryModel) {
        const val = memoryModel[prop];
        return typeof val === "function" ? val.bind(memoryModel) : val;
      }
      const val = target[prop];
      return typeof val === "function" ? val.bind(target) : val;
    },
  });
}
