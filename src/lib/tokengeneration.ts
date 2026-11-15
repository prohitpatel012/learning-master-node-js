
import jwt from "jsonwebtoken";

export const generateAccessToken = (
  userId: string,
  role: string
): string => {
  const payload = {
    sub: userId,
    role,
  };

  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET as string,
    {
      expiresIn: "60m",
      algorithm: "HS256",
    }
  );
};
