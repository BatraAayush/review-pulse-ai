import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSignupVerificationOtpEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if account already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please log in.' },
        { status: 409 }
      );
    }

    const dbEmailKey = `signup:${normalizedEmail}`;

    // Rate limiting: check if an active OTP was created within the last 60 seconds
    const recentOtp = await prisma.passwordResetOtp.findFirst({
      where: {
        email: dbEmailKey,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // within last 1 minute
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      const waitSeconds = Math.max(1, Math.ceil((recentOtp.createdAt.getTime() + 60000 - Date.now()) / 1000));
      return NextResponse.json(
        { error: `Please wait ${waitSeconds} seconds before requesting a new verification code` },
        { status: 429 }
      );
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Invalidate previous unused signup OTPs for this email
    await prisma.passwordResetOtp.updateMany({
      where: {
        email: dbEmailKey,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Save fresh signup OTP
    await prisma.passwordResetOtp.create({
      data: {
        email: dbEmailKey,
        otp,
        expiresAt,
        used: false,
      },
    });

    // Send real email via SMTP
    const emailResult = await sendSignupVerificationOtpEmail(normalizedEmail, otp, name);

    if (!emailResult.success) {
      await prisma.passwordResetOtp.deleteMany({
        where: { email: dbEmailKey, otp },
      });

      return NextResponse.json(
        { error: emailResult.error || 'Failed to dispatch verification email. Please check your SMTP configuration.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}`,
    });
  } catch (error) {
    console.error('Send signup OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}

