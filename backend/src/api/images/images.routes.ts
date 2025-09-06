import { Router } from 'express';
import * as imageService from './images.service';

const router = Router();

router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const image = await imageService.getImageById(id);

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // If image has a URL (seeded images), redirect to that URL
        if (image.url) {
            return res.redirect(image.url);
        }

        // If image has imageData (uploaded images), serve the blob
        if (image.imageData && image.mimetype) {
            res.setHeader('Content-Type', image.mimetype);
            return res.send(image.imageData);
        }

        // If neither URL nor imageData, return 404
        return res.status(404).json({ message: 'Image not found' });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
