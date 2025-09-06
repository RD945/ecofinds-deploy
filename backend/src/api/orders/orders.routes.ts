import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { getOrderHistory, checkout } from './orders.controller';

const router = Router();

router.use(protect);

router.get('/history', getOrderHistory);
router.post('/checkout', checkout);

export default router;
