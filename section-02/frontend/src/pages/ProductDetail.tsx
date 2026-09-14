import { useEffect, useState } from "react";
import { api, type Product } from "../api/client";

type Props = {
    productId: string;
    onBack: () => void;
    onCheckout: (productId: string, quantity: number) => void;
};

export function ProductDetail({ productId, onBack, onCheckout }: Props) {
    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState("1");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api
            .getProduct(productId)
            .then(setProduct)
            .catch((e) => setError((e as Error).message));
    }, [productId]);

    if (error) {
        return (
           <div className="max-w-2xl">
                <p className="text-sm text-[var(--color-status-failed)] mb-4">{error}</p>
                <button onClick={onBack} className="text-sm text-[var(--color-ink-muted)] hover:underline">
                &larr; Back to shop
                </button>
            </div>
        );
    }
    
    if (!product) {
        return <p className="text-sm text-[var(--color-ink-muted)]">Loading...</p>;
    }

    return (
        <div className="max-w-2xl">
            <button
                onClick={onBack}
                className="text-sm text-[var(--color-ink-muted)] hover:underline mb-4"
            >
                &larr; Back to shop
            </button>

            <div className="border border-[var(--color-line)] p-6">
                <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                <p className="text-sm text-[var(--color-ink-muted)] mb-6">${product.price}</p>
                <p className="text-sm text-[var(--color-ink-muted)] mb-6">
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </p>

                {product.stock > 0 && (
                    <div className="flex items-center gap-2">
                        <input
                            className="w-20 border border-[var(--color-line)] bg-transparent px-2 py-1 text-sm font-mono"
                            type="number"
                            min="1"
                            max={product.stock}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                        <button
                            onClick={() => onCheckout(product.id, parseInt(quantity, 10))}
                            className="px-4 py-1.5 text-sm border border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors"
                        >
                            Buy now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}