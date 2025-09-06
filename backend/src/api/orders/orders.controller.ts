import { Response } from 'express';
import { z } from 'zod';
import * as orderService from './orders.service';
import { AuthRequest } from '../../middleware/auth.middleware';

const deliveryLocationSchema = z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
    coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
    }),
});

const checkoutSchema = z.object({
    deliveryLocation: deliveryLocationSchema.optional(),
});

export async function getOrderHistory(req: AuthRequest, res: Response) {
    try {
        const orders = await orderService.getOrderHistory(req.user!.id);
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function checkout(req: AuthRequest, res: Response) {
    try {
        const { deliveryLocation } = checkoutSchema.parse(req.body);
        const order = await orderService.createOrder(req.user!.id, deliveryLocation);
        if (!order) {
            return res.status(400).json({ message: 'Cart is empty' });
        }
        res.status(201).json(order);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid input', errors: error.issues });
        }
        console.error('Checkout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
