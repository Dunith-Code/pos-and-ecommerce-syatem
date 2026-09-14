import { useEffect, useState } from "react";
import { api, type Product, type Order } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";

export function Checkout() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [order, setOrder] = useState<Order | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [paymentResult, setPaymentResult] = useState<string | null>(null);

    useEffect(() => {
        api.listProducts().then(setProducts).catch((e) => setError(e.message));
    }, []);

    const selectedProduct = products.find((p) => p.id === selectedProductId);

    async function handleReserve(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedProduct) return;
        setError(null);
        setPaymentResult(null);
        try {
            const idempotencyKey = `checkout-${selectedProductId}-${Date.now()}`;
            const newOrder = await api.checkout({
                productId: selectedProductId,
                quantity: parseInt(quantity, 10),
                idempotencyKey,
                unitPrice: parseFloat(selectedProduct.price),
            });
            setOrder(newOrder);
        } catch (e) {
            setError((e as Error).message);
        }
    }

    async function handlePay(outcome: "SUCCESS" | "FAILED" | "TIMEOUT") {
        if (!order) return;
        setError(null);
        try {
            const idempotencyKey = `payment-${order.id}-${Date.now()}`;
            const result = await api.processPayment(order.id, {
                idempotencyKey,
                forcedOutcome: outcome,
            });
            setPaymentResult(
                result.duplicate
                ? "Duplicate payment - original result returned"
                : `Payment ${result.payment.status}`
            );
            const refreshed = await api.getOrder(order.id);
            setOrder(refreshed);
        } catch (e) {
            setError((e as Error).message);
        }
    }

    return (
        <div className="max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">Checkout</h2>

            {error && (
                <p className="mb-4 text-sm text-[var(--color-status-failed)]">{error}</p>
            )}

            <form onSubmit={handleReserve} className="flex gap-2 mb-6">
                <select
                    className="flex-1 border border-[var(--color-line)] bg-transparent px-2 py-1 text-sm"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                >
                    <option value="" disabled>
                        Select a product
                    </option>
                    {products.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name} - ${p.price} ({p.stock} in stock)
                        </option>
                    ))}
                </select>
                <input
                    className="w-20 border border-[var(--color-line)] bg-transparent px-2 py-1 text-sm font-mono"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="px-3 py-1 text-sm border border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors"
                >
                    Reserve stock
                </button>
            </form>

            {order && (
                <div className="border border-[var(--color-line)] p-4 text-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-[var(--color-ink-muted)]">
                            {order.id}
                        </span>
                        <StatusBadge status={order.status} />
                    </div>

                    {order.items.map((item) => (
                        <p key={item.id} className="font-mono text-xs mb-1">
                            qty {item.quantity} x ${item.unitPrice}
                        </p>
                    ))}

                    {order.reservedUntil && (
                        <p className="text-xs text-[var(--color-ink-muted)] mb-3">
                            Reserved until {new Date(order.reservedUntil).toLocaleTimeString()}
                        </p>
                    )}

                    {order.status === "RESERVED" && (
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => handlePay("SUCCESS")}
                                className="px-2 py-1 text-xs border border-[var(--color-status-paid)] text-[var(--color-status-paid)] hover:bg-[var(--color-status-paid)] hover:text-[var(--color-paper)] transition-colors"
                            >
                                Simulate success
                            </button>
                            <button
                                onClick={() => handlePay("FAILED")}
                                className="px-2 py-1 text-xs border border-[var(--color-status-failed)] text-[var(--color-status-failed)] hover:bg-[var(--color-status-failed)] hover:text-[var(--color-paper)] transition-colors"
                            >
                                Simulate failure
                            </button>
                            <button
                                onClick={() => handlePay("TIMEOUT")}
                                className="px-2 py-1 text-xs border border-[var(--color-ink-muted)] text-[var(--color-ink-muted)] hover:bg-[var(--color-ink-muted)] hover:text-[var(--color-paper)] transition-colors"
                            >
                                Simulate timeout
                            </button>
                        </div>
                    )}
                    {paymentResult && (
                        <p className="mt-3 text-xs text-[var(--color-ink-muted)]">{paymentResult}</p>
                    )}
                </div>
            )}
        </div>
    );
}
