import jwt from "jsonwebtoken";

export const getCookieOptions = () => {
  const isSecureDeployment =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.VERCEL);

  return {
    httpOnly: true,
    sameSite: isSecureDeployment ? "none" : "lax",
    secure: isSecureDeployment,
    path: "/",
  };
};

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    ...getCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();