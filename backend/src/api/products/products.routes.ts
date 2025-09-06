import { Router } from 'express';
import multer from 'multer';
import { protect } from '../../middleware/auth.middleware';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from './products.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, upload.array('images', 5), createProduct);
router.put('/:id', protect, upload.fields([{ name: 'images', maxCount: 5 }]), updateProduct);
router.delete('/:id', protect, deleteProduct);

export default router;
