import cron from "node-cron";
import { prisma } from "../db/client";

export async function expireStaleReservations() {
    const staleOrders = await prisma.order.findMany({
        where: {
            status: "RESERVED",
            reservedUntil: { lt: new Date() },
        },
        include: { items: true },
    });

    for (const order of staleOrders) {
        await prisma.$transaction(async (tx) => {
            for (const item of order.items) {
                await tx.$executeRaw`
                UPDATE "Product"
                SET stock = stock + ${item.quantity}
                WHERE id = ${item.productId}`;
            }

            await tx.order.update({
                where: { id: order.id },
                data: { status: "EXPIRED" },
            });
        });
    }

    if (staleOrders.length > 0) {
        console.log(`Expired ${staleOrders.length} stale reservation(s)`);
    }

    return staleOrders.length;
}

export function startExpiryJob() {
    cron.schedule("*/30 * * * * *", () => {
        expireStaleReservations().catch((err) => {
            console.error("Reservation expiry job failed:", err);
        });
    });
    console.log("Reservation expiry job scheduled (every 30s)");
}