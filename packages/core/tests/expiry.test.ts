import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../src/db/client";
import { reserveStock } from "../src/services/reservationService";
import { expireStaleReservations } from "../src/jobs/expireReservations";

describe("reservation expiry", () => {
    let productId: string;

    afterAll(async () => {
        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.product.deleteMany({ where: { id: productId } });
        await prisma.$disconnect();
    });

    it("expires a stale reservation and restores stock", async () => {
        const product = await prisma.product.create({
            data: { name: "Expiry Test Widget", price: 5.0, stock: 3 },
        });
        productId = product.id;

        const order = await reserveStock(productId, 2, "expiry-test-1", 5.0);

        // force the reservation into the past
        await prisma.order.update({
            where: { id: order.id },
            data: { reservedUntil: new Date(Date.now() - 1000) },
        });

        const expiredCount = await expireStaleReservations();
        expect(expiredCount).toBe(1);

        const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
        expect(updatedOrder?.status).toBe("EXPIRED");

        const updatedProduct = await prisma.product.findUnique({ where: { id: productId } });
        expect(updatedProduct?.stock).toBe(3);
    });
});