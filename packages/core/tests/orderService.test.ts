import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../src/db/client";
import { reserveStock } from "../src/services/reservationService";
import { processPayment } from "../src/services/paymentService";
import {
    cancelOrder,
    InvalidTransitionError,
} from "../src/services/orderService";

describe("order cancellation and status transitions", () => {
    const productIds: string[] = [];

    afterAll(async () => {
        await prisma.payment.deleteMany({});
        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.product.deleteMany({ where: { id: { in: productIds } }});
        await prisma.$disconnect();
    });

    async function makeReservedOrder(stock: number) {
        const product = await prisma.product.create({
            data: { name: "Cancel Test Widget", price: 15.0, stock },
        });
        productIds.push(product.id);
        const order = await reserveStock(
            product.id,
            1,
            `cancel-test-${product.id}`,
            15.0
        );
        return { product, order };
    }

    it("cancels a RESERVED order and releases stock", async () => {
        const { order, product } = await makeReservedOrder(1);

        const result = await cancelOrder(order.id);
        expect(result.refunded).toBe(false);

        const updateOrder = await prisma.order.findUnique({ where: { id: order.id } });
        expect(updateOrder?.status).toBe("CANCELLED");

        const updateProduct = await prisma.product.findUnique({ where: { id: product.id } });
        expect(updateProduct?.stock).toBe(1);
    });

    it("cancels a PAID order, restores stock, and marks it refunded", async () => {
        const { order, product } = await makeReservedOrder(1);
        await processPayment(order.id, `cancel-paid-${order.id}`, "SUCCESS");

        const result = await cancelOrder(order.id, "Customer request");
        expect(result.refunded).toBe(true);

        const updateOrder = await prisma.order.findUnique({ where: { id: order.id } });
        expect(updateOrder?.status).toBe("CANCELLED");

        const updateProduct = await prisma.product.findUnique({ where: { id: product.id } });
        expect(updateProduct?.stock).toBe(1);
    });

    it("rejects cncelling an already-EXPIRED order", async () => {
        const { order } = await makeReservedOrder(1);

        // force it into EXPIRED directly to test the transition guard
        await prisma.order.update({
            where: { id: order.id },
            data: { status: "EXPIRED" },
        });

        await expect(cancelOrder(order.id)).rejects.toThrow(InvalidTransitionError);
    });

    it("rejects cancelling an already-CANCELLED order", async () => {
        const { order } = await makeReservedOrder(1);
        await cancelOrder(order.id);

        await expect(cancelOrder(order.id)).rejects.toThrow(InvalidTransitionError);
    });
});