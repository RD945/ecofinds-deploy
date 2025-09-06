import { Router } from 'express';
import { seedDatabase } from './seed.controller';

const router = Router();

// Temporary endpoint to seed database - remove after use!
router.post('/seed-db', seedDatabase);

export default router;
