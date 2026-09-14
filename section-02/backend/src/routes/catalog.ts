import { Router } from "express";
import { prisma } from "core/dist/db/client";

const router = Router();

// GET /api/catalog?search
router.get("/", async (req, res, next) => {
    try {
        const { search, minPrice, maxPrice, inStock } = req.query;

        const where: any = {};

        if (search && typeof search === "string") {
            where.name = { contains: search, mode: "insensitive" };
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice as string);
            if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
        }

        if (inStock === "true") {
            where.stock = { gt: 0 };
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        res.json(products);
    } catch (err) {
        next(err);
    }
});

// GET /api/catalog/:id - product detail view
router.get("/:id", async (req, res, next) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
        });
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json(product);
    } catch (err) {
        next(err);
    }
});

export default router;