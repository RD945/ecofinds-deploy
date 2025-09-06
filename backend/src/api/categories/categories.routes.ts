import { Router } from 'express';
import * as categoryService from './categories.service';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const categories = await categoryService.getCategories();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
