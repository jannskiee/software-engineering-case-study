import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = loginSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
        }

        const { email, password } = result.data;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const token = await signToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        cookies().set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        });

        return NextResponse.json({
            message: 'Login successful',
            role: user.role.toLowerCase()
        }, { status: 200 });

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
