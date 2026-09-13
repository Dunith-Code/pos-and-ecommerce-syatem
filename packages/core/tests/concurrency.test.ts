import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/db/client";
import { reserveStock } from "../src/services/reservationService";

describe("concurrrency-safe stock reservation", () => {
    let productId: string;

    beforeAll(async () => {
        const product = await prisma.product.create({
            data: { name: "Test Widget", price: 10.0, stock: 5 },
        });
        productId = product.id;
    });

    afterAll(async () => {
        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.product.delete({ where: { id: productId } });
        await prisma.$disconnect();
    });
    
    it("allows exactly 5 of 20 concurrent request to succees for 5 stock", async () => {
        const attempts = Array.from({ length: 20 }, (_, i) =>
            reserveStock(productId, 1, `concurrency-test-${i}`, 10.0).then(
                () => "success",
                () => "failure"
            )
        );

        const results = await Promise.all(attempts);
        const successCount = results.filter((r) => r === "success").length;
        const failureCount = results.filter((r) => r === "failure").length;

        expect(successCount).toBe(5);
        expect(failureCount).toBe(15);

        const finalProduct = await prisma.product.findUnique({ where: { id: productId } });
        expect(finalProduct?.stock).toBe(0);
    });
});