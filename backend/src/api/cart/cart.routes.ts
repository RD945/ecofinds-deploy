import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { getCart, addItemToCart, removeItemFromCart } from './cart.controller';

const router = Router();

router.use(protect);

router.get('/', getCart);
router.post('/', addItemToCart);
router.delete('/:productId', removeItemFromCart);

export default router;
