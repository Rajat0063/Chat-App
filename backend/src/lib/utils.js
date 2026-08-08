import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const isSecureDeployment =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.VERCEL);

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: isSecureDeployment ? "none" : "lax",
    secure: isSecureDeployment,
    path: "/",
  });

  return token;
};

export const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();