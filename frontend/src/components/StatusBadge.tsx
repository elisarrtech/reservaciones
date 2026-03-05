import type { PaymentStatus } from "../types/reservation";

interface StatusBadgeProps {
  status: PaymentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  const isPaid = status === "paid";

  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        isPaid
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-900"
      ].join(" ")}
    >
      {isPaid ? "Paid" : "Unpaid"}
    </span>
  );
}

