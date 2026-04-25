import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  role: "admin" | "police";
  email?: string;
}

export const generateToken = (
  userId: string,
  role: "admin" | "police",
  email?: string
) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  const payload: TokenPayload = {
    userId,
    role,
    ...(email ? { email } : {}), // ✅ FIX
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};