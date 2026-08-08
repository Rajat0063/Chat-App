import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const protectRoute = async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.jwt;
    const authHeader = typeof req.headers?.authorization === "string" ? req.headers.authorization : "";
    const bearerToken = authHeader.replace(/^Bearer\s+/i, "");
    const token = cookieToken || bearerToken;

    if (!token) return res.status(401).json({ message: "Unauthorized - No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(401).json({ message: "Unauthorized - Invalid token" });

    const user = await User.findById(decoded.userId || decoded._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    console.log("protectRoute error:", err.message);
    res.status(401).json({ message: "Unauthorized" });
  }
};