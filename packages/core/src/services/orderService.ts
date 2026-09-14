import { prisma } from "../db/client";
import { releaseStock } from "./reservationService";

export type OrderStatusValue =
    | "PENDING"
    | "RESERVED"
    | "PAID"
    | "CANCELLED"
    | "EXPIRED"
    | "FAILED";

export class InvalidTransitionError extends Error {
    constructor(from: string, to: string) {
        super(`Cannot transition order from ${from} to ${to}`);
        this.name = "InvalidTransitionError";
    }
}

export class OrderNotFoundError extends Error {
    constructor(orderId: string) {
        super(`Order ${orderId} not found`);
        this.name = "OrderNotFoundError";
    }
}

const VALID_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
    PENDING: ["RESERVED", "CANCELLED"],
    RESERVED: ["PAID", "FAILED", "EXPIRED", "CANCELLED"],
    PAID: ["CANCELLED"],
    CANCELLED: [],
    EXPIRED: [],
    FAILED: [],
};

export function assertValidTransition(
    from: OrderStatusValue,
    to: OrderStatusValue
) {
    if (!VALID_TRANSITIONS[from].includes(to)) {
        throw new InvalidTransitionError(from, to);
    }
}

export async function cancelOrder(orderId: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
        const lockedOrders = await tx.$queryRaw<
            { id: string; status: OrderStatusValue }[]
        >`SELECT id, status FROM "Order" WHERE id = ${orderId} FOR UPDATE`;

        const order = lockedOrders[0];
        if (!order) {
            throw new OrderNotFoundError(orderId);
        }

        assertValidTransition(order.status, "CANCELLED");

        const wasPaid = order.status === "PAID";

        if (order.status === "RESERVED" || wasPaid) {
            await releaseStock(orderId, tx as any);
        }

        await tx.order.update({
            where: { id: orderId },
            data: { status: "CANCELLED", reservedUntil: null },
        });

        if (wasPaid) {
            // mock refund
            console.log(
                `[refund] Simulated refund issued for order ${orderId}${reason ? ` (${reason})` : ""
                }`
            );
        }

        return { orderId, previousStatus: order.status, refunded: wasPaid };
    });
}
