type Status = "PENDING" | "RESERVED" | "PAID" | "CANCELLED" | "EXPIRED" | "FAILED";

const STATUS_STYLES: Record<Status, string> = {
    PENDING: "text-[var(--color-ink-muted)] border-[var(--color-line)]",
    RESERVED: "text-[var(--color-status-reserved)] border-[var(--color-status-reserved)]",
    PAID: "text-[var(--color-status-paid)] border-[var(--color-status-paid)]",
    CANCELLED: "text-[var(--color-status-cancelled)] border-[var(--color-status-cancelled)]",
    EXPIRED: "text-[var(--color-status-cancelled)] border-[var(--color-status-cancelled)]",
    FAILED: "text-[var(--color-status-failed)] border-[var(--color-status-failed)]",
};

export function StatusBadge({ status }: { status: Status }) {
    return (
        <span
            className={`inline-block px-2 py-0.5 text-xs font-mono border rounded ${STATUS_STYLES[status]}`}
        >
            {status}
        </span>
    );
}

