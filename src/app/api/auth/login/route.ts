import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        businesses: {
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const primaryBusiness = user.businesses[0];

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'SUPER_ADMIN' | 'OWNER',
      businessId: primaryBusiness?.id,
      businessSlug: primaryBusiness?.slug,
    };

    await setSessionCookie(sessionPayload);

    return NextResponse.json({
      success: true,
      user: sessionPayload,
      redirectUrl: user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred during login' },
      { status: 500 }
    );
  }
}
