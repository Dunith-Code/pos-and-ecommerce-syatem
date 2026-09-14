import { Router } from "express";
import {
    processPayment,
    DuplicatePaymentError,
    InvalidOrderStateError,
    OrderNotFoundError,
} from "core/dist/services/paymentService";

const router = Router();

// POST /api/payments/:orderId - process a mock payment for an order
router.post("/:orderId", async (req, res, next) => {
    try {
        const { idempotencyKey, forcedOutcome } = req.body;
        if (!idempotencyKey) {
            return res.status(400).json({
                error: "idempotencyKey is required",
            });
        }

        const result = await processPayment(
            req.params.orderId,
            idempotencyKey,
            forcedOutcome
        );
        res.json(result);
    } catch (err) {
        if (err instanceof OrderNotFoundError) {
            return res.status(404).json({ error: err.message });
        }
        if (err instanceof DuplicatePaymentError) {
            return res.status(409).json({ error: err.message });
        }
        if (err instanceof InvalidOrderStateError) {
            return res.status(409).json({ error: err.message });
        }
        next(err);
    }
});

export default router;