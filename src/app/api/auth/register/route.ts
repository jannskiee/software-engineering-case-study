import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import * as z from 'zod';

const registerSchema = z.object({
    email: z.string().email('Invalid DLSU-D email address').endsWith('@dlsud.edu.ph', 'Must use a @dlsud.edu.ph email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['STUDENT', 'PROFESSOR', 'ADMIN', 'SUPERADMIN']),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = registerSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
        }

        const { email, password, role } = result.data;

        const existingUser = await db.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role as any,
                verified: true,
            }
        });

        return NextResponse.json({ message: 'Account created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Register Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
