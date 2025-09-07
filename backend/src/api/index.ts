import { Router } from 'express';
import authRouter from './auth/auth.routes';
import productRouter from './products/products.routes';
import cartRouter from './cart/cart.routes';
import orderRouter from './orders/orders.routes';
import categoryRouter from './categories/categories.routes';
import imageRouter from './images/images.routes';
import seedRouter from './seed/seed.routes';

const router = Router();

// Health check endpoint for monitoring services like UptimeRobot
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'EcoFinds API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/categories', categoryRouter);
router.use('/images', imageRouter);
router.use('/seed', seedRouter);


export default router;
