import { Response } from 'express';
import { z } from 'zod';
import * as productService from './products.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export async function getProducts(req: AuthRequest, res: Response) {
  try {
    const { category, search } = req.query;
    const products = await productService.getProducts(category as string, search as string);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getProductById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(Number(id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

const productSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  category_id: z.coerce.number().int().positive(),
  image_url: z.string().url().optional().nullable(),
  quantity: z.coerce.number().int().min(0),
  condition: z.string().min(3),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year_of_manufacture: z.coerce.number().int().optional().nullable(),
  material: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  dimension_l: z.coerce.number().optional().nullable(),
  dimension_w: z.coerce.number().optional().nullable(),
  dimension_h: z.coerce.number().optional().nullable(),
  is_original: z.boolean().optional(),
  has_manual: z.boolean().optional(),
  working_condition: z.string().optional().nullable(),
  // REMOVING 'images' from here, as it will be handled from req.files
});

export async function createProduct(req: AuthRequest, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];
    
    const parsedBody = {
      ...req.body,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      category_id: req.body.category_id ? parseInt(req.body.category_id, 10) : undefined,
      quantity: req.body.quantity ? parseInt(req.body.quantity, 10) : undefined,
      year_of_manufacture: req.body.year_of_manufacture ? parseInt(req.body.year_of_manufacture, 10) : undefined,
      dimension_l: req.body.dimension_l ? parseFloat(req.body.dimension_l) : undefined,
      dimension_w: req.body.dimension_w ? parseFloat(req.body.dimension_w) : undefined,
      dimension_h: req.body.dimension_h ? parseFloat(req.body.dimension_h) : undefined,
      is_original: req.body.is_original === 'true',
      has_manual: req.body.has_manual === 'true',
    };

    const parsedData = productSchema.parse(parsedBody);
    
    const productData = {
        ...parsedData,
        seller: { connect: { id: req.user!.id } },
        category: { connect: { id: Number(parsedData.category_id) } },
        images: {
            create: files.map(file => ({
                imageData: file.buffer,
                mimetype: file.mimetype,
            })),
        }
    };
    // @ts-ignore
    delete productData.category_id;


    const product = await productService.createProduct(productData as any);
    res.status(201).json(product);

  } catch (error) {
     if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

const productUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.coerce.number().positive().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  image_url: z.string().url().optional().nullable(),
  quantity: z.coerce.number().int().min(0).optional(),
  condition: z.string().min(3).optional(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year_of_manufacture: z.coerce.number().int().optional().nullable(),
  material: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  dimension_l: z.coerce.number().optional().nullable(),
  dimension_w: z.coerce.number().optional().nullable(),
  dimension_h: z.coerce.number().optional().nullable(),
  is_original: z.coerce.boolean().optional(),
  has_manual: z.coerce.boolean().optional(),
  working_condition: z.string().optional().nullable(),
});

// Robust updateProduct controller: handles multipart/form-data and JSON safely
export async function updateProduct(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    // Defensive: ensure body is always an object
    const body = req.body ?? {};

    // Dev logs (safe length)
    console.log('[updateProduct] Content-Type:', req.headers['content-type']);
    console.log('[updateProduct] body keys:', Object.keys(body));
    console.log('[updateProduct] files present:', !!req.files);

    // Normalize existingImageIds: accept existingImageIds OR existingImages for compatibility
    let existingImageIdsRaw: any = body.existingImageIds ?? body.existingImages ?? [];

    // If it's a JSON string like '["1","2"]', try to parse it
    if (typeof existingImageIdsRaw === 'string' && existingImageIdsRaw.trim().startsWith('[')) {
      try {
        existingImageIdsRaw = JSON.parse(existingImageIdsRaw);
      } catch (e) {
        // leave as-is (will be wrapped below)
      }
    }

    // If it's a single string id, wrap in array
    if (!Array.isArray(existingImageIdsRaw)) {
      if (existingImageIdsRaw === undefined || existingImageIdsRaw === null || existingImageIdsRaw === '') {
        existingImageIdsRaw = [];
      } else {
        existingImageIdsRaw = [existingImageIdsRaw];
      }
    }

    // Convert to number[] and filter invalid entries
    const imageIds: number[] = (existingImageIdsRaw as any[])
      .map((s) => {
        const n = Number(s);
        return Number.isNaN(n) ? null : n;
      })
      .filter((n): n is number => n !== null);

    // Files from multer (route must use upload.fields([{ name: 'images', maxCount: 5 }]))
    const files = (req.files as any)?.images ?? [];

    // Build parsed object only from provided fields (coerce strings to numbers/booleans where needed)
    const parsedBody: Record<string, any> = {};
    if (body.title !== undefined) parsedBody.title = body.title;
    if (body.description !== undefined) parsedBody.description = body.description;
    if (body.price !== undefined && body.price !== '') parsedBody.price = parseFloat(String(body.price));
    if (body.category_id !== undefined && body.category_id !== '') parsedBody.category_id = parseInt(String(body.category_id), 10);
    if (body.quantity !== undefined && body.quantity !== '') parsedBody.quantity = parseInt(String(body.quantity), 10);
    if (body.condition !== undefined) parsedBody.condition = body.condition;
    if (body.brand !== undefined) parsedBody.brand = body.brand === '' ? null : body.brand;
    if (body.model !== undefined) parsedBody.model = body.model === '' ? null : body.model;
    if (body.year_of_manufacture !== undefined && body.year_of_manufacture !== '') parsedBody.year_of_manufacture = parseInt(String(body.year_of_manufacture), 10);
    if (body.material !== undefined) parsedBody.material = body.material === '' ? null : body.material;
    if (body.color !== undefined) parsedBody.color = body.color === '' ? null : body.color;
    if (body.dimension_l !== undefined && body.dimension_l !== '') parsedBody.dimension_l = parseFloat(String(body.dimension_l));
    if (body.dimension_w !== undefined && body.dimension_w !== '') parsedBody.dimension_w = parseFloat(String(body.dimension_w));
    if (body.dimension_h !== undefined && body.dimension_h !== '') parsedBody.dimension_h = parseFloat(String(body.dimension_h));
    if (body.is_original !== undefined) parsedBody.is_original = (String(body.is_original) === 'true' || body.is_original === true);
    if (body.has_manual !== undefined) parsedBody.has_manual = (String(body.has_manual) === 'true' || body.has_manual === true);
    if (body.working_condition !== undefined) parsedBody.working_condition = body.working_condition === '' ? null : body.working_condition;

    // Validate using existing zod schema (productUpdateSchema)
    const productData = productUpdateSchema.parse(parsedBody);

    // Call service with normalized files and image ids
    const updated = await productService.updateProduct(
      Number(id),
      req.user!.id,
      productData,
      files as Express.Multer.File[],
      imageIds
    );

    return res.json(updated);
  } catch (err) {
    console.error('[updateProduct] Error:', err);

    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: err.issues });
    }

    // In development you can return err.message for faster debugging; in production keep generic
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteProduct(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(Number(id));

     if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller_id !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    await productService.deleteProduct(Number(id), req.user!.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
