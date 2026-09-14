import { useEffect, useState } from "react";
import { api, type Product, type Order } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";

type Props = {
  productId: string;
  quantity: number;
  onComplete: () => void;
};

export function Checkout({ productId, quantity, onComplete }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    api.getProduct(productId).then(setProduct).catch((e) => setError(e.message));
  }, [productId]);

  async function handleReserve() {
    if (!product) return;
    setReserving(true);
    setError(null);
    try {
      const idempotencyKey = `checkout-${productId}-${Date.now()}`;
      const newOrder = await api.checkout({
        productId,
        quantity,
        idempotencyKey,
        unitPrice: parseFloat(product.price),
      });
      setOrder(newOrder);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReserving(false);
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

  if (!product) {
    return <p className="text-sm text-[var(--color-ink-muted)]">Loading...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Checkout</h2>

      {error && (
        <p className="mb-4 text-sm text-[var(--color-status-failed)]">{error}</p>
      )}

      <div className="border border-[var(--color-line)] p-4 text-sm mb-4">
        <p className="font-medium mb-1">{product.name}</p>
        <p className="font-mono text-xs text-[var(--color-ink-muted)]">
          qty {quantity} x ${product.price}
        </p>
      </div>

      {!order && (
        <button
          onClick={handleReserve}
          disabled={reserving}
          className="px-4 py-1.5 text-sm border border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors disabled:opacity-50"
        >
          {reserving ? "Reserving..." : "Reserve & continue"}
        </button>
      )}

      {order && (
        <div className="border border-[var(--color-line)] p-4 text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-[var(--color-ink-muted)]">
              {order.id}
            </span>
            <StatusBadge status={order.status} />
          </div>

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

          {order.status === "PAID" && (
            <button
              onClick={onComplete}
              className="mt-4 text-xs text-[var(--color-ink-muted)] hover:underline"
            >
              Back to shop
            </button>
          )}
        </div>
      )}
    </div>
  );
}