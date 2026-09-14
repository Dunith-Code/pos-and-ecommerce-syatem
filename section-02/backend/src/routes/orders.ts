import { Router } from "express";
import { prisma } from "core/dist/db/client";
import { reserveStock, OutOfStockError } from "core/dist/services/reservationService";
import { cancelOrder, InvalidTransitionError, OrderNotFoundError } from "core/dist/services/orderService";

const router = Router();

// POST /api/orders/checkout - create a cart order and reserve stock
router.post("/checkout", async (req, res, next) => {
    try {
        const { productId, quantity, idempotencyKey, unitPrice } = req.body;
        if (!productId || !quantity || !idempotencyKey || unitPrice == null) {
            return res.status(400).json({
                error: "productId, quantity, idempotencyKey, and unitPrice are required",
            });
        }

        const order = await reserveStock(productId, quantity, idempotencyKey, unitPrice);
        res.status(201).json(order);
    } catch (err) {
        if (err instanceof OutOfStockError) {
            return res.status(409).json({ error: err.message });
        }
        next(err);
    }
});

// GET /api/orders/:id
router.get("/:id", async (req, res, next) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { items: true, payments: true },
        });
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json(order);
    } catch (err) {
        next(err);
    }
});

// GET /api/orders - list all orders (order history)
router.get("/", async (_req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: "desc" },
            include: { items: true, payments: true },
        });
        res.json(orders);
    } catch (err) {
        next(err);
    }
});

// POST /api/orders/:id/cancel
router.post("/:id/cancel", async (req, res, next) => {
    try {
        const { reason } = req.body;
        const result = await cancelOrder(req.params.id, reason);
        res.json(result);
    } catch (err) {
        if (err instanceof OrderNotFoundError) {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

export default router;