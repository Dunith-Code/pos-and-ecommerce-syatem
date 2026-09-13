import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../src/db/client";
import { reserveStock } from "../src/services/reservationService";
import {
    processPayment,
    DuplicatePaymentError,
} from "../src/services/paymentService";

describe("payment processing", () => {
    const productIds: string[] = [];

    afterAll(async () => {
        await prisma.payment.deleteMany({});
        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.product.deleteMany({ where: { id: { in: productIds } } });
        await prisma.$disconnect();
    });

    async function makeReservedOrder(stock: number) {
        const product = await prisma.product.create({
            data: { name: "Payment Test Widget", price: 20.0, stock },
        });
        productIds.push(product.id);
        const order = await reserveStock(
            product.id,
            1,
            `payment-test-${product.id}`,
            20.0
        );
        return { product, order };
    }

    it("SUCCESS: marks order PAID and clears reserveUntil", async () => {
        const { order } = await makeReservedOrder(1);

        const result = await processPayment(order.id, `pay-${order.id}`, "SUCCESS");

        expect(result.duplicate).toBe(false);
        const updated = await prisma.order.findUnique({ where: { id: order.id } });
        expect(updated?.status).toBe("PAID");
        expect(updated?.reservedUntil).toBeNull();
    });

    it("FAILED: marks order FAILED and releases stock", async () => {
        const { order, product } = await makeReservedOrder(1);

        await processPayment(order.id, `pay-${order.id}`, "FAILED");

        const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
        expect(updatedOrder?.status).toBe("FAILED");

        const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
        expect(updatedProduct?.stock).toBe(1);
    });

    it("TIMEOUT: leaves order RESERVED", async () => {
        const { order } = await makeReservedOrder(1);

        await processPayment(order.id, `pay-${order.id}`, "TIMEOUT");

        const updated = await prisma.order.findUnique({ where: { id: order.id } });
        expect(updated?.status).toBe("RESERVED");
    });

    it("rejects a duplicate payment on an already-PAID order", async () => {
        const { order } = await makeReservedOrder(1);
        const idempotencyKey = `pay-${order.id}`;

        await processPayment(order.id, idempotencyKey, "SUCCESS");

        // save idempotency key for later - returns the original, marked duplicate
        const repeat = await processPayment(order.id, idempotencyKey, "SUCCESS");
        expect(repeat.duplicate).toBe(true);
    });

    it("throws DuplicatePaymentError on a genuinely new attempt against a PAID order", async () => {
        const { order } = await makeReservedOrder(1);
        await processPayment(order.id, `pay-${order.id}-1`, "SUCCESS");

        await expect(
            processPayment(order.id, `pay-${order.id}-2`, "SUCCESS")
        ).rejects.toThrow(DuplicatePaymentError);
    });
});