import { Router } from 'express';
import authRouter from './auth/auth.routes';
import productRouter from './products/products.routes';
import cartRouter from './cart/cart.routes';
import orderRouter from './orders/orders.routes';
import categoryRouter from './categories/categories.routes';
import imageRouter from './images/images.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/categories', categoryRouter);
router.use('/images', imageRouter);


export default router;
