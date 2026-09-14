import { useEffect, useState } from "react";
import { api, type Product } from "../api/client";

export function ProductManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", price: "", stock: "" });

    async function load() {
        try {
            setProducts(await api.listProducts());
            setError(null);
        } catch (e) {
            setError((e as Error).message);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        try {
            await api.createProduct({
                name: form.name,
                price: parseFloat(form.price),
                stock: parseInt(form.stock, 10),
            });
            setForm({ name: "", price: "", stock: "" });
            load();
        } catch (e) {
            setError((e as Error).message);
        }
    }

    async function handleDelete(id: string) {
        try {
            await api.deleteProduct(id);
            load();
        } catch (e) {
            setError((e as Error).message);
        }
    }

    return (
        <div className="max-w-3xl">
            <h2 className="text-lg font-semibold mb-4">Products</h2>

            {error && (
                <p className="mb-4 text-sm text-[var(--color-status-failed)]">{error}</p>
            )}

            <form onSubmit={handleCreate} className="flex gap-2 mb-6">
                <input
                    className="flex-1 border border-[var(--color-line)] bg-transparent px-2 py-1 text-sm"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />
                <input
                    className="w-24 border border-[var(--color-line)] bg-transparent px-2 py-1 text-sm font-mono"
                    placeholder="Price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                />
                <input
                    className="w-20 border border-[var(--color-line)] bg-transparent px-2 py-1 text-sm font-mono"
                    placeholder="Stock"
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    required
                />
                <button
                    type="submit"
                    className="px-3 py-1 text-sm border border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors"
                >
                    Add product
                </button>
            </form>

            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-[var(--color-line)] text-left text-[var(--color-ink-muted)]">
                        <th className="pb-2 font-normal">Name</th>
                        <th className="pb-2 font-normal">Price</th>
                        <th className="pb-2 font-normal">Stock</th>
                        <th className="pb-2 font-normal"></th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((p) => (
                        <tr key={p.id} className="border-b border-[var(--color-line)]">
                            <td className="py-2">{p.name}</td>
                            <td className="py-2 font-mono">${p.price}</td>
                            <td className="py-2 font-mono">{p.stock}</td>
                            <td className="py-2 text-right">
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    className="text-xs text-[var(--color-status-failed)] hover:underline"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}