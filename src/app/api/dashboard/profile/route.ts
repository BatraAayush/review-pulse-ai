import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSessionCookie, comparePassword, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET current user profile
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

// PUT update user profile (name, email) or change password
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        businesses: {
          select: { id: true, slug: true },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 1. Password change requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to set a new password' },
          { status: 400 }
        );
      }

      const isCurrentValid = await comparePassword(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: 'The current password you entered is incorrect' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      const newPasswordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      });

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully',
      });
    }

    // 2. Profile Details update (Name and/or Email)
    const updateData: { name?: string; email?: string } = {};

    if (name && name.trim().length > 0) {
      updateData.name = name.trim();
    }

    if (email && email.trim().toLowerCase() !== user.email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }

      // Check if email taken by someone else
      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existing && existing.id !== user.id) {
        return NextResponse.json(
          { error: 'This email is already in use by another account' },
          { status: 409 }
        );
      }

      updateData.email = normalizedEmail;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No profile changes provided' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Re-issue session cookie with updated name/email
    const primaryBusiness = user.businesses[0];
    await setSessionCookie({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role as 'SUPER_ADMIN' | 'OWNER',
      businessId: primaryBusiness?.id,
      businessSlug: primaryBusiness?.slug,
    });

    return NextResponse.json({
      success: true,
      message: 'Account details updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
  }
}
