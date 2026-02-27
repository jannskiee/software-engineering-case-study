import * as z from 'zod';

export const emailSchema = z.object({
    email: z.string().email().endsWith('@dlsud.edu.ph', 'Must be a valid @dlsud.edu.ph email address'),
});

export const registerSchema = z.object({
    email: z.string().email().endsWith('@dlsud.edu.ph', 'Invalid email domain'),
    password: z.string().min(8, 'Password must be at least 8 characters').regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    role: z.enum(['STUDENT', 'PROFESSOR', 'ADMIN', 'SUPERADMIN']),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
});
