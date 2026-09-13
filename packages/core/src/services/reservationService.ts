import { prisma } from "../db/client";

const RESERVATION_MINUTES =5;

export class OutOfStockError extends Error {
    constructor(productId: string) {
        super(`Insufficient stock for product ${productId}`);
        this.name = "OutOfStockError";
    }
}

export async function reserveStock(
    productId: string,
    quantity: number,
    idempotencyKey: string,
    unitPrice: number
) {
    return prisma.$transaction(async (tx) => {
        // idempotency check
        const existing = await tx.order.findUnique({
            where: { idempotencyKey },
            include: { items: true },
        });
        if (existing) return existing;

        // atomic conditional decrement
        const updateResult = await tx.$executeRaw`
            UPDATE "Product"
            SET stock = stock - ${quantity}
            WHERE id = ${productId} AND stock >= ${quantity}`;
        
            if (updateResult === 0) {
                throw new OutOfStockError(productId);
            }

            const reservedUntil = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

            const order = await tx.order.create({
                data: {
                    status: "RESERVED",
                    idempotencyKey,
                    reservedUntil,
                    items: {
                        create: [{ productId, quantity, unitPrice }],
                    },
                },
                include: { items: true },
            });

            return order;
    });
}

export async function releaseStock(orderId: string, client?: typeof prisma) {
    const run = async (tx: typeof prisma) => {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order) return null;

        for (const item of order.items) {
            await tx.$executeRaw`
                UPDATE "Product"
                SET stock = stock + ${item.quantity}
                WHERE id = ${item.productId}`;
        }

        return order;
    };

    if (client) return run(client);
    return prisma.$transaction((tx) => run(tx as unknown as typeof prisma));  
}