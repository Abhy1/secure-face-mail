import { z } from 'zod';

export const emailSchema = z.object({
  recipient: z.string().email('Invalid email address').max(255, 'Email too long'),
  subject: z.string().min(1, 'Subject required').max(200, 'Subject too long'),
  message: z.string().min(1, 'Message required').max(10000, 'Message too long'),
});

export const otpSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
});
