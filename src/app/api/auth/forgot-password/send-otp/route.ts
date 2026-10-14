import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetOtpEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if account exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account was found with this email address' },
        { status: 404 }
      );
    }

    // Rate limiting: check if an active OTP was created within the last 60 seconds
    const recentOtp = await prisma.passwordResetOtp.findFirst({
      where: {
        email: normalizedEmail,
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

    // Invalidate any previous unused OTPs for this email to avoid clutter
    await prisma.passwordResetOtp.updateMany({
      where: {
        email: normalizedEmail,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Save fresh OTP
    await prisma.passwordResetOtp.create({
      data: {
        email: normalizedEmail,
        otp,
        expiresAt,
        used: false,
      },
    });

    // Dispatch real email via SMTP
    const emailResult = await sendPasswordResetOtpEmail(normalizedEmail, otp);

    if (!emailResult.success) {
      // Remove newly created OTP if email couldn't be delivered
      await prisma.passwordResetOtp.deleteMany({
        where: { email: normalizedEmail, otp },
      });

      return NextResponse.json(
        { error: emailResult.error || 'Failed to dispatch verification email. Please check your SMTP configuration in .env.' },
        { status: 500 }
      );
    }

    // Success response WITHOUT any OTP returned in JSON
    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your inbox.`,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}
