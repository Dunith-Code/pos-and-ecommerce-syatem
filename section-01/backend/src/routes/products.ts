import { Router } from "express";
import { prisma } from "core/dist/db/client";

const router = Router();

// GET /api/products - list all products with current stock
router.get("/", async (_req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.json(products);
    } catch (err) {
        next(err);
    }
});

// GET /api/products/:id
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

// POST /api/products - create a product
router.post("/", async (req, res, next) => {
    try {
        const { name, price, stock } = req.body;
        if (!name || price == null || stock == null) {
            return res
                .status(400)
                .json({ error: "name, price, and stock are required" });
        }
        const product = await prisma.product.create({
            data: { name, price, stock },
        });
        res.status(201).json(product);
    } catch (err) {
        next(err);
    }
});

// PUT /api/products/:id - update a product
router.put("/:id", async (req, res, next) => {
    try {
        const { name, price, stock } = req.body;
        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: { name, price, stock },
        });
        res.json(product);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res, next) => {
    try {
        await prisma.product.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

export default router;
