import { prisma } from "../db/client";
import { releaseStock } from "./reservationService";

export type PaymentOutcome = "SUCCESS" | "FAILED" | "TIMEOUT";

export class DuplicatePaymentError extends Error {
    constructor(orderId: string) {
        super(`Order ${orderId} has already been paid or processed`);
        this.name = "DuplicatePaymentError";
    }
}

export class InvalidOrderStateError extends Error {
    constructor(orderId: string, status: string) {
        super(`Order ${orderId} is in status ${status}, cannot process payment`);
        this.name = "InvalidOrderStateError";
    }
}

export class OrderNotFoundError extends Error {
    constructor(orderId: string) {
        super(`Order ${orderId} not found`);
        this.name = "OrderNotFoundError";
    }
}


// simulates a payment getway call
function simulateGateway(forcedOutcome?: PaymentOutcome): PaymentOutcome {
    if (forcedOutcome) return forcedOutcome;
    const roll = Math.random();
    if (roll < 0.7) return "SUCCESS";
    if (roll < 0.9) return "FAILED";
    return "TIMEOUT";
}

// processes payment for a RESERVED order
export async function processPayment(
    orderId: string,
    idempotencyKey: string,
    forcedOutcome?: PaymentOutcome
) {
    return prisma.$transaction(async (tx) => {
        // idempotency
        const existingPayment = await tx.payment.findUnique({
            where: { idempotencyKey },
        });
        if (existingPayment) {
            return { payment: existingPayment, duplicate: true };
        }

        // row lock
        const lockedOrders = await tx.$queryRaw<{ id: string; status: string }[]>`SELECT id, status FROM "Order" WHERE id = ${orderId} FOR UPDATE`;

        const order = lockedOrders[0];
        if (!order) {
            throw new OrderNotFoundError(orderId);
        }

        if (order.status === "PAID") {
            throw new DuplicatePaymentError(orderId);
        }

        if (order.status !== "RESERVED") {
            throw new InvalidOrderStateError(orderId, order.status);
        }
        
        const outcome = simulateGateway(forcedOutcome);
        
        const payment = await tx.payment.create({
            data: { orderId, status: outcome, idempotencyKey },
        });

        if (outcome === "SUCCESS") {
            await tx.order.update({
                where: { id: orderId },
                data: { status: "PAID", reservedUntil: null  },
            });
        } else if (outcome === "FAILED") {
            await tx.order.update({
                where: { id: orderId },
                data: { status: "FAILED" },
            });
            await releaseStock(orderId, tx as any);
        }

        // timeout

        return { payment, duplicate: false };
    });
}

