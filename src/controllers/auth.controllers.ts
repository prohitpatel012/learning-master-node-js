import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { userRegistrationSchema, userSigninSchema } from "../zod/userSchema.js";
import { query } from "../config/db.js";
import { logger } from "../config/logger.js";
import { generateAccessToken } from '../lib/tokengeneration.js'

export const signUp = async (req: Request, res: Response) => {
  const parsedBody = userRegistrationSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsedBody.error.issues.map(issue => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  const { name, email, password, whatsapp_number } = parsedBody.data;

  try {
    // 1. Check if user already exists
    const existingUser = await query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1;",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A user with this email address already exists"
      });
    }

    // 2. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Insert the new user into PostgreSQL
    const insertQuery = `
      INSERT INTO users (name, email, password_hash, whatsapp_number)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, whatsapp_number, is_active, created_at;
    `;

    const result = await query(insertQuery, [
      name,
      email,
      passwordHash,
      whatsapp_number || null
    ]);

    const newUser = result.rows[0];

    logger.info(`User registered successfully: ${newUser.email} (${newUser.role})`);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        whatsapp_number: newUser.whatsapp_number,
        is_active: newUser.is_active,
        created_at: newUser.created_at
      }
    });
  } catch (err: any) {
    logger.error({ err: err.message }, "Error during user registration");
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const signIn = async (req: Request, res: Response) => {
  const parsedBody = userSigninSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsedBody.error.issues.map(issue => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  const { email, password } = parsedBody.data;

  try {
    const userResult = await query(
      "SELECT id, name, email, password_hash, role, whatsapp_number, is_active FROM users WHERE email = $1 LIMIT 1;",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    logger.info(`User logged in: ${user.email}`);

    const accessToken =  generateAccessToken(user.id, user.role);

    return res.status(200).cookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
       maxAge: 7 * 24 * 60 * 60 * 1000
    }).json({
      success: true,
      message: "Logged in successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        whatsapp_number: user.whatsapp_number,
        access_token: accessToken
      }
    });
  } catch (err: any) {
    logger.error({ err: err.message }, "Error during user signin");
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};





export const signOut = (req: Request, res: Response) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  }).json({
    success: true,
    message: "Logged out successfully"
  });
}
