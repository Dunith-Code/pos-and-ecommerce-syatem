import { useState } from "react";
import { ProductManagement } from "./pages/ProductManagement";
import { Checkout } from "./pages/Checkout";
import { OrderHistory } from "./pages/OrderHistory";

type Tab = "products" | "checkout" | "orders";

const TABS: { id: Tab; label: string }[] = [
  { id: "products", label: "Products" },
  { id: "checkout", label: "Checkout" },
  { id: "orders", label: "Order History" },
];

function App() {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-line)] px-6 py-4">
        <h1 className="text-sm font-mono text-[var(--color-ink-muted)]">
          SECTION 01 - POS ORDER &amp; INVENTORY SYSTEM
        </h1>
      </header>

      <nav className="border-b border-[var(--color-line)] px-6 flex gap-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-3 text-sm border-b-2 -mb-px transition-colors ${ tab === t.id
              ? "border-[var(--color-ink)] text-[var(--color-ink)]"
              : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="p-6">
        {tab === "products" && <ProductManagement />}
        {tab === "checkout" && <Checkout />}
        {tab === "orders" && <OrderHistory />}
      </main>
    </div>
  );
}

export default App;
