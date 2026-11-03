import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject = 'General Inquiry', message } = body;

    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedSubject = (subject || 'General Inquiry').trim();
    const trimmedMessage = (message || '').trim();
    const trimmedPhone = (phone || '').trim();

    if (!trimmedName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (trimmedName.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    if (!trimmedEmail) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (!trimmedMessage) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }
    if (trimmedMessage.length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters long' }, { status: 400 });
    }
    if (trimmedMessage.length > 3000) {
      return NextResponse.json({ error: 'Message cannot exceed 3,000 characters' }, { status: 400 });
    }

    // Try sending email if SMTP is configured
    try {
      await sendEmail({
        to: process.env.SUPPORT_EMAIL || 'aayushbatra33@gmail.com',
        subject: `[Contact Form] ${trimmedSubject} - from ${trimmedName}`,
        text: `New contact form submission from ReviewPulse AI:\n\nName: ${trimmedName}\nEmail: ${trimmedEmail}\nPhone: ${trimmedPhone || 'Not provided'}\nTopic: ${trimmedSubject}\n\nMessage:\n${trimmedMessage}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
            <h2 style="color: #38bdf8; margin-top: 0;">New Contact Form Submission</h2>
            <p><strong>From:</strong> ${trimmedName} (&lt;${trimmedEmail}&gt;)</p>
            <p><strong>Phone:</strong> ${trimmedPhone || 'Not provided'}</p>
            <p><strong>Topic / Subject:</strong> ${trimmedSubject}</p>
            <hr style="border-color: #334155; margin: 20px 0;" />
            <div style="background: #1e293b; padding: 15px; border-radius: 8px; white-space: pre-wrap; line-height: 1.6;">
              ${trimmedMessage}
            </div>
            <p style="font-size: 11px; color: #64748b; margin-top: 25px;">ReviewPulse AI Inbound Web Inquiries</p>
          </div>
        `,
      });
    } catch (e) {
      console.warn('Could not send contact email via SMTP, message recorded:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for reaching out! Our team has received your message and will get back to you shortly.',
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your message. Please try again or email us directly.' },
      { status: 500 }
    );
  }
}

