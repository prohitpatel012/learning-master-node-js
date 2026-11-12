import { z } from "zod";

export const userRoleEnum = z.enum(["CUSTOMER", "SUPERADMIN", "PLATFORM_ADMIN"]);

export const userRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  whatsapp_number: z.string().optional()
  // role: userRoleEnum.default("CUSTOMER")
});

export const userSigninSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export type UserRole = z.infer<typeof userRoleEnum>;
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserSigninInput = z.infer<typeof userSigninSchema>;
