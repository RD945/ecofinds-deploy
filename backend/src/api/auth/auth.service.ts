import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../utils/password';
import { sendEmail } from '../../utils/mailer';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateOtp() {
    return crypto.randomInt(100000, 1000000).toString(); // 6-digit OTP
}

export async function createUser(username: string, email: string, password: string) {
  const password_hash = await hashPassword(password);
  try {
    return await prisma.user.create({
      data: {
        username,
        email,
        password_hash,
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('User with this email or username already exists');
    }
    throw error;
  }
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserByIdentifier(identifier: string) {
    return prisma.user.findFirst({
        where: {
            OR: [
                { email: identifier },
                { username: identifier }
            ],
        },
    });
}

export async function findUserById(id: number) {
    return prisma.user.findUnique({
        where: { id },
    });
}

export async function generateAndSendOtp(user: any) {
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
        where: { id: user.id },
        data: {
            two_factor_secret: otp,
            two_factor_expires_at: otpExpires,
        },
    });

    const message = `
        <h1>Your EcoFinds Login Verification Code</h1>
        <p>Your One-Time Password (OTP) is:</p>
        <h2 style="text-align:center; font-size: 24px; letter-spacing: 5px;">${otp}</h2>
        <p>This code will expire in 10 minutes.</p>
    `;

    await sendEmail({
        to: user.email,
        subject: 'Your EcoFinds Login OTP',
        html: message,
    });
}


export async function verifyOtp(userId: number, otp: string) {
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            two_factor_secret: otp,
            two_factor_expires_at: { gt: new Date() },
        },
    });

    if (!user) {
        throw new Error('Invalid or expired OTP.');
    }

    // Clear the OTP after successful verification
    await prisma.user.update({
        where: { id: userId },
        data: {
            two_factor_secret: null,
            two_factor_expires_at: null,
        },
    });

    return user;
}


export async function sendPasswordResetEmail(email: string) {
    const user = await findUserByEmail(email);
    if (!user) {
        // To prevent email enumeration, we don't throw an error here.
        // The controller will send a generic success message.
        console.log(`Password reset requested for non-existent user: ${email}`);
        return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
        where: { email },
        data: {
            reset_password_token: passwordResetToken,
            reset_password_token_expires_at: passwordResetExpires,
        },
    });

    // TODO: The frontend URL should ideally come from an environment variable
    const resetUrl = `http://localhost:8080/reset-password?token=${resetToken}`;

    const message = `
        <h1>You have requested a password reset</h1>
        <p>Please go to this link to reset your password:</p>
        <a href="${resetUrl}" target="_blank">${resetUrl}</a>
        <p>This link will expire in 10 minutes.</p>
    `;

    try {
        await sendEmail({
            to: user.email,
            subject: 'Password Reset Request for EcoFinds',
            html: message,
        });
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        // Even if email fails, don't throw error to the user, but we should log it.
        // In a real app, you would have more robust monitoring/alerting here.
    }
}

export async function resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
        where: {
            reset_password_token: hashedToken,
            reset_password_token_expires_at: { gt: new Date() },
        },
    });

    if (!user) {
        throw new Error('Token is invalid or has expired.');
    }

    const password_hash = await hashPassword(newPassword);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password_hash,
            reset_password_token: null,
            reset_password_token_expires_at: null,
        },
    });
}

export async function setTwoFactor(userId: number, enabled: boolean) {
    return prisma.user.update({
        where: { id: userId },
        data: { two_factor_enabled: enabled },
        select: { id: true, two_factor_enabled: true } // Return only safe data
    });
}
