import { useEffect, useState } from "react";
import { api, type Order } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setOrders(await api.listOrders());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(id: string) {
    try {
      await api.cancelOrder(id, "cancelled from order history");
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const cancellableStatuses = ["PENDING", "RESERVED", "PAID"];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Order history</h2>
        <button
          onClick={load}
          className="text-xs text-[var(--color-ink-muted)] hover:underline"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-[var(--color-status-failed)]">{error}</p>
      )}

      {orders.length === 0 && (
        <p className="text-sm text-[var(--color-ink-muted)]">No orders yet.</p>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-[var(--color-line)] p-3 text-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-[var(--color-ink-muted)]">
                {order.id}
              </span>
              <StatusBadge status={order.status} />
            </div>

            {order.items.map((item) => (
              <p key={item.id} className="font-mono text-xs text-[var(--color-ink-muted)]">
                qty {item.quantity} x ${item.unitPrice}
              </p>
            ))}

            <p className="text-xs text-[var(--color-ink-muted)] mt-1">
              Created {new Date(order.createdAt).toLocaleString()}
            </p>

            {cancellableStatuses.includes(order.status) && (
              <button
                onClick={() => handleCancel(order.id)}
                className="mt-2 text-xs text-[var(--color-status-failed)] hover:underline"
              >
                Cancel order
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}