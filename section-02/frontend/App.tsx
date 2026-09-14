import { useState } from "react";
import { ProductDetail } from "./pages/ProductDetail";
import { Checkout } from "./pages/Checkout";
import { OrderHistory } from "./pages/OrderHistory";

type View =
  | { name: "listing" }
  | { name: "detail"; productId: string }
  | { name: "checkout"; productId: string; quantity: number }
  | { name: "history" };

type ProductListingProps = {
  onSelect: (productId: string) => void;
};

function ProductListing({ onSelect }: ProductListingProps) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">Products</h2>
      <button
        type="button"
        className="mt-4 underline"
        onClick={() => onSelect("1")}
      >
        View product
      </button>
    </section>
  );
}

function App() {
  const [view, setView] = useState<View>({ name: "listing" });

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-line)] px-6 py-4 flex items-center justify-between">
        <h1
          className="text-sm font-mono text-[var(--color-ink-muted)] cursor-pointer"
          onClick={() => setView({ name: "listing" })}
        >
          SECTION 02 - E-COMMERCE CHECKOUT AND PAYMENT SYSTEM
        </h1>
        <nav className="flex gap-4">
          <button
            onClick={() => setView({ name: "listing" })}
            className={`text-sm ${
              view.name === "listing" ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"
            } hover:text-[var(--color-ink)] transition-colors`}
          >
            Shop
          </button>
          <button
            onClick={() => setView({ name: "history" })}
            className={`text-sm ${
              view.name === "history" ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"
            } hover:text-[var(--color-ink)] transition-colors`}
          >
            Order history
          </button>
        </nav>
      </header>

      <main className="p-6">
        {view.name === "listing" && (
          <ProductListing
            onSelect={(productId) => setView({ name: "detail", productId })}
          />
        )}

        {view.name === "detail" && (
          <ProductDetail
            productId={view.productId}
            onBack={() => setView({ name: "listing" })}
            onCheckout={(productId, quantity) =>
              setView({ name: "checkout", productId, quantity })
            }
          />
        )}

        {view.name === "checkout" && (
          <Checkout
            productId={view.productId}
            quantity={view.quantity}
            onComplete={() => setView({ name: "listing" })}
          />
        )}

        {view.name === "history" && <OrderHistory />}
      </main>
    </div>
  );
}

export default App;