import { useEffect, useState } from "react";
import { api, type Product } from "../api/client";

type Props = {
  onSelect: (productId: string) => void;
};

export function ProductListing({ onSelect }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const results = await api.searchCatalog({
        search: search || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        inStock: inStockOnly || undefined,
      });
      setProducts(results);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  return (
    <div className="max-w-5xl">
      <h2 className="text-lg font-semibold mb-4">Shop</h2>

      {error && (
        <p className="mb-4 text-sm text-[var(--color-status-failed)]">{error}</p>
      )}

      <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-2 mb-6">
        <input
          className="flex-1 min-w-[160px] border border-[var(--color-line)] bg-transparent px-2 py-1 text-sm"
          placeholder="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="w-24 border border-[var(--color-line)] bg-transparent px-2 py-1 text-sm font-mono"
          type="number"
          placeholder="Min $"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
        <input
          className="w-24 border border-[var(--color-line)] bg-transparent px-2 py-1 text-sm font-mono"
          type="number"
          placeholder="Max $"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
        <label className="flex items-center gap-1 text-sm text-[var(--color-ink-muted)]">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          In stock only
        </label>
        <button
          type="submit"
          className="px-3 py-1 text-sm border border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors"
        >
          Filter
        </button>
      </form>

      {products.length === 0 && (
        <p className="text-sm text-[var(--color-ink-muted)]">No products found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="text-left border border-[var(--color-line)] p-3 hover:border-[var(--color-ink)] transition-colors"
          >
            <p className="text-sm font-medium mb-1">{p.name}</p>
            <p className="text-sm font-mono">${p.price}</p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">
              {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}