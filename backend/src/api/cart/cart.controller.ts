import { Response } from 'express';
import { z } from 'zod';
import * as cartService from './cart.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export async function getCart(req: AuthRequest, res: Response) {
  try {
    const cartItems = await cartService.getCart(req.user!.id);
    res.status(200).json(cartItems);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

const addToCartSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().min(1),
});

export async function addItemToCart(req: AuthRequest, res: Response) {
  try {
    const { productId, quantity } = addToCartSchema.parse(req.body);
    const cartItem = await cartService.addItemToCart(req.user!.id, productId, quantity);
    res.status(201).json(cartItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function removeItemFromCart(req: AuthRequest, res: Response) {
  try {
    const { productId } = req.params;
    await cartService.removeItemFromCart(req.user!.id, Number(productId));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
