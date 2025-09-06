import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from './auth.service';
import { verifyPassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendEmail } from '../../utils/mailer';

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function register(req: Request, res: Response) {
  try {
    const { username, email, password } = registerSchema.parse(req.body);
    const user = await authService.createUser(username, email, password);
    const token = generateToken({ userId: user.id });
    
    // Schedule welcome suggestions email to be sent after 1 minute (new user)
    setTimeout(async () => {
      await sendWelcomeSuggestions(email, username, false);
    }, 60000); // 60 seconds = 1 minute
    
    res.status(201).json({ token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    }
    if (error instanceof Error && error.message === 'User with this email or username already exists') {
        return res.status(409).json({ message: 'User with this email or username already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

const loginSchema = z.object({
  identifier: z.string(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

const resetPasswordSchema = z.object({
    token: z.string(),
    password: z.string().min(6),
});

const verifyOtpSchema = z.object({
    userId: z.number().int(),
    otp: z.string().length(6),
});

const setTwoFactorSchema = z.object({
    enabled: z.boolean(),
});

export async function login(req: Request, res: Response) {
  try {
    const { identifier, password } = loginSchema.parse(req.body);
    const user = await authService.findUserByIdentifier(identifier);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // --- 2FA Logic ---
    if (user.two_factor_enabled) {
        await authService.generateAndSendOtp(user);
        return res.status(200).json({ twoFactorEnabled: true, userId: user.id });
    }
    // --- End 2FA Logic ---

    const token = generateToken({ userId: user.id });
    const { password_hash, ...userWithoutPassword } = user;
    
    // Schedule welcome suggestions email to be sent after 1 minute for login (returning user)
    setTimeout(async () => {
      await sendWelcomeSuggestions(user.email, user.username, true);
    }, 60000); // 60 seconds = 1 minute
    
    res.status(200).json({ token, user: userWithoutPassword });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function verifyOtp(req: Request, res: Response) {
    try {
        const { userId, otp } = verifyOtpSchema.parse(req.body);
        const user = await authService.verifyOtp(userId, otp);
        
        const token = generateToken({ userId: user.id });
        const { password_hash, ...userWithoutPassword } = user;
        
        // Schedule welcome suggestions email to be sent after 1 minute for 2FA login (returning user)
        setTimeout(async () => {
          await sendWelcomeSuggestions(user.email, user.username, true);
        }, 60000); // 60 seconds = 1 minute
        
        res.status(200).json({ token, user: userWithoutPassword });

    } catch (error) {
         if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid input', errors: error.issues });
        }
        if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getMe(req: AuthRequest, res: Response) {
    try {
        const user = await authService.findUserById(req.user!.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const { password_hash, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function forgotPassword(req: Request, res: Response) {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        await authService.sendPasswordResetEmail(email);
        res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid input', errors: error.issues });
        }
        // We send a generic success message even if the user doesn't exist to prevent email enumeration attacks
        res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
    }
}

export async function resetPassword(req: Request, res: Response) {
    try {
        const { token, password } = resetPasswordSchema.parse(req.body);
        await authService.resetPassword(token, password);
        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid input', errors: error.issues });
        }
        if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function setTwoFactorStatus(req: AuthRequest, res: Response) {
    try {
        const { enabled } = setTwoFactorSchema.parse(req.body);
        const result = await authService.setTwoFactor(req.user!.id, enabled);
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid input', errors: error.issues });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Email notification schemas
const cartNotificationSchema = z.object({
    email: z.string().email(),
    productName: z.string(),
    productPrice: z.string(),
});

const paymentConfirmationSchema = z.object({
    email: z.string().email(),
    orderTotal: z.number(),
    itemCount: z.number(),
    paymentData: z.object({
        cardNumber: z.string(),
        cardholderName: z.string(),
    }),
    deliveryLocation: z.object({
        address: z.string(),
        city: z.string(),
        state: z.string(),
        postalCode: z.string(),
        country: z.string(),
        coordinates: z.object({
            lat: z.number(),
            lng: z.number(),
        }),
    }).optional(),
});

const suggestionsSchema = z.object({
    email: z.string().email(),
    suggestions: z.array(z.object({
        title: z.string(),
        price: z.string(),
        category: z.string(),
    })),
});

// Sample suggestions for new users
const getWelcomeSuggestions = () => [
    {
        title: "Bamboo Toothbrush Set",
        price: "299",
        category: "home"
    },
    {
        title: "Organic Cotton T-Shirt",
        price: "899",
        category: "clothing"
    },
    {
        title: "Reusable Water Bottle",
        price: "599",
        category: "home"
    },
    {
        title: "Eco-Friendly Notebook",
        price: "249",
        category: "home"
    }
];

// Function to send welcome suggestions after a delay
const sendWelcomeSuggestions = async (email: string, username: string, isReturningUser: boolean = false) => {
    try {
        const suggestions = getWelcomeSuggestions();
        
        const suggestionsList = suggestions.map(item => `
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <h4 style="margin: 0 0 8px 0; color: #374151;">${item.title}</h4>
                <p style="margin: 0 0 5px 0; color: #6b7280; text-transform: capitalize;">Category: ${item.category}</p>
                <p style="margin: 0; font-weight: bold; color: #2563eb;">₹${item.price}</p>
            </div>
        `).join('');
        
        const welcomeTitle = isReturningUser 
            ? `🌱 Welcome back, ${username}!`
            : `🌱 Welcome to EcoFinds, ${username}!`;
            
        const welcomeText = isReturningUser
            ? `Great to see you again! Here are some fresh eco-friendly product suggestions just for you:`
            : `Thank you for joining our eco-conscious community! Here are some popular sustainable products to get you started:`;
            
        const specialSection = isReturningUser
            ? `<div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #92400e;">🌟 Personalized Picks</h3>
                <p style="margin: 0; color: #92400e;">
                    These suggestions are based on trending eco-friendly products in our community!
                </p>
            </div>`
            : `<div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #047857;">🎉 New User Special</h3>
                <p style="margin: 0; color: #065f46;">
                    Enjoy browsing our collection of eco-friendly products from verified sustainable sellers!
                </p>
            </div>`;

        const message = `
            <h1>${welcomeTitle}</h1>
            <p>${welcomeText}</p>
            
            <div style="margin: 20px 0;">
                ${suggestionsList}
            </div>
            
            <p>These carefully curated products are perfect for anyone ${isReturningUser ? 'continuing' : 'starting'} their sustainable lifestyle journey. Each purchase supports environmentally friendly practices!</p>
            
            ${specialSection}
            
            <p style="margin-top: 30px;">
                <a href="http://localhost:8080/" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    ${isReturningUser ? 'Explore New Products' : 'Start Shopping Now'}
                </a>
            </p>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
                Questions? Check out your <a href="http://localhost:8080/dashboard">dashboard</a> or browse our <a href="http://localhost:8080/">marketplace</a>
            </p>
        `;

        const subject = isReturningUser
            ? '🌿 Fresh Eco-Friendly Picks Just for You!'
            : '🌿 Welcome to EcoFinds - Your Sustainable Shopping Journey Begins!';

        await sendEmail({
            to: email,
            subject: subject,
            html: message,
        });

        console.log(`Welcome suggestions sent to ${email}`);
    } catch (error) {
        console.error('Failed to send welcome suggestions:', error);
    }
};

// Email notification handlers
export async function sendCartNotification(req: AuthRequest, res: Response) {
    try {
        const { email, productName, productPrice } = cartNotificationSchema.parse(req.body);
        
        const message = `
            <h1>Item Added to Your Cart!</h1>
            <p>Great choice! You've successfully added the following item to your cart:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">${productName}</h3>
                <p style="margin: 0; font-size: 18px; color: #2563eb; font-weight: bold;">₹${productPrice}</p>
            </div>
            <p>Don't forget to complete your purchase!</p>
            <p style="margin-top: 30px;">
                <a href="http://localhost:8080/cart" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Cart & Checkout
                </a>
            </p>
        `;

        await sendEmail({
            to: email,
            subject: `🛒 ${productName} added to your cart!`,
            html: message,
        });

        res.status(200).json({ message: 'Cart notification sent successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid input', errors: error.issues });
        }
        console.error('Failed to send cart notification:', error);
        res.status(500).json({ message: 'Failed to send notification' });
    }
}

export async function sendPaymentConfirmation(req: AuthRequest, res: Response) {
    try {
        const { email, orderTotal, itemCount, paymentData, deliveryLocation } = paymentConfirmationSchema.parse(req.body);
        
        const orderId = `ECO-${Date.now()}`;
        const maskedCardNumber = `****-****-****-${paymentData.cardNumber.slice(-4)}`;
        
        const deliverySection = deliveryLocation ? `
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #0369a1;">🚚 Delivery Information</h3>
                <div style="background: white; padding: 15px; border-radius: 6px;">
                    <p style="margin: 0 0 8px 0;"><strong>Address:</strong></p>
                    <p style="margin: 0 0 5px 0; color: #374151;">${deliveryLocation.address}</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">${deliveryLocation.city}, ${deliveryLocation.state} ${deliveryLocation.postalCode}</p>
                    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${deliveryLocation.country}</p>
                </div>
            </div>
        ` : '';
        
        const message = `
            <h1>🎉 Payment Successful!</h1>
            <p>Thank you for your purchase on EcoFinds! Your order has been confirmed.</p>
            
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #0369a1;">Order Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e0e7ff;"><strong>Order ID:</strong></td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e0e7ff;">${orderId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e0e7ff;"><strong>Items:</strong></td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e0e7ff;">${itemCount} item(s)</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e0e7ff;"><strong>Total Amount:</strong></td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e0e7ff; font-weight: bold; color: #2563eb;">₹${orderTotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
                        <td style="padding: 8px 0;">${maskedCardNumber}</td>
                    </tr>
                </table>
            </div>
            
            ${deliverySection}
            
            <p>Your sustainable products will be processed and shipped soon. You can track your order status in your dashboard.</p>
            
            <p style="margin-top: 30px;">
                <a href="http://localhost:8080/dashboard" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Order Status
                </a>
            </p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Thank you for choosing sustainable products and supporting our eco-friendly marketplace! 🌱
            </p>
        `;

        await sendEmail({
            to: email,
            subject: `✅ Order Confirmed - ${orderId} (₹${orderTotal.toFixed(2)})`,
            html: message,
        });

        res.status(200).json({ message: 'Payment confirmation sent successfully', orderId });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid input', errors: error.issues });
        }
        console.error('Failed to send payment confirmation:', error);
        res.status(500).json({ message: 'Failed to send confirmation' });
    }
}

export async function sendSuggestions(req: AuthRequest, res: Response) {
    try {
        const { email, suggestions } = suggestionsSchema.parse(req.body);
        
        const suggestionsList = suggestions.map(item => `
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <h4 style="margin: 0 0 8px 0; color: #374151;">${item.title}</h4>
                <p style="margin: 0 0 5px 0; color: #6b7280; text-transform: capitalize;">Category: ${item.category}</p>
                <p style="margin: 0; font-weight: bold; color: #2563eb;">₹${item.price}</p>
            </div>
        `).join('');
        
        const message = `
            <h1>🌱 Eco-Friendly Recommendations Just for You!</h1>
            <p>Based on your recent activity on EcoFinds, we thought you might like these sustainable products:</p>
            
            <div style="margin: 20px 0;">
                ${suggestionsList}
            </div>
            
            <p>These products align with your eco-conscious values and could be great additions to your sustainable lifestyle!</p>
            
            <p style="margin-top: 30px;">
                <a href="http://localhost:8080/" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Explore More Products
                </a>
            </p>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
                Want to unsubscribe from recommendations? <a href="http://localhost:8080/dashboard">Manage preferences</a>
            </p>
        `;

        await sendEmail({
            to: email,
            subject: '🌿 Personalized Eco-Friendly Product Suggestions',
            html: message,
        });

        res.status(200).json({ message: 'Suggestions sent successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid input', errors: error.issues });
        }
        console.error('Failed to send suggestions:', error);
        res.status(500).json({ message: 'Failed to send suggestions' });
    }
}
