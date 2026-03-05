import { type ChangeEvent, useMemo, useState } from "react";

import type {
  PaymentStatus,
  Reservation,
  ReservationFilters
} from "../types/reservation";
import { StatusBadge } from "./StatusBadge";

interface ReservationTableProps {
  reservations: Reservation[];
  filters: ReservationFilters;
  isLoading: boolean;
  adminModeEnabled: boolean;
  onFiltersChange: (filters: ReservationFilters) => void;
  onRefresh: () => Promise<void>;
  onToggleStatus: (reservation: Reservation) => Promise<void>;
  onDelete: (reservationId: number) => Promise<void>;
}

function formatDate(rawDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(rawDate));
}

function formatDateTime(rawDateTime: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(rawDateTime));
}

export function ReservationTable({
  reservations,
  filters,
  isLoading,
  adminModeEnabled,
  onFiltersChange,
  onRefresh,
  onToggleStatus,
  onDelete
}: ReservationTableProps): JSX.Element {
  const [busyReservationId, setBusyReservationId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totals = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    reservations.forEach((reservation) => {
      if (reservation.payment_status === "paid") {
        paid += 1;
      } else {
        unpaid += 1;
      }
    });
    return { paid, unpaid, total: reservations.length };
  }, [reservations]);

  async function runAction(
    reservationId: number,
    action: () => Promise<void>
  ): Promise<void> {
    setBusyReservationId(reservationId);
    setErrorMessage(null);
    try {
      await action();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Action failed unexpectedly."
      );
    } finally {
      setBusyReservationId(null);
    }
  }

  function handlePaymentFilterChange(
    event: ChangeEvent<HTMLSelectElement>
  ): void {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      payment_status: value ? (value as PaymentStatus) : undefined
    });
  }

  function handleCheckInFromChange(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    onFiltersChange({
      ...filters,
      check_in_from: event.target.value || undefined
    });
  }

  function handleCheckInToChange(event: ChangeEvent<HTMLInputElement>): void {
    onFiltersChange({
      ...filters,
      check_in_to: event.target.value || undefined
    });
  }

  return (
    <section className="rounded-3xl bg-white/90 p-6 shadow-panel backdrop-blur-sm md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-title text-xs uppercase tracking-[0.28em] text-coral">
            Administration
          </p>
          <h2 className="font-title text-2xl text-ink">Reservation Control Panel</h2>
        </div>
        <button
          className="rounded-xl border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => {
            void onRefresh();
          }}
          disabled={!adminModeEnabled || isLoading}
          type="button"
        >
          Refresh
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink/70">
            Payment status
          </span>
          <select
            className="field"
            value={filters.payment_status ?? ""}
            onChange={handlePaymentFilterChange}
            disabled={!adminModeEnabled}
          >
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink/70">
            Check-in from
          </span>
          <input
            className="field"
            type="date"
            value={filters.check_in_from ?? ""}
            onChange={handleCheckInFromChange}
            disabled={!adminModeEnabled}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink/70">
            Check-in to
          </span>
          <input
            className="field"
            type="date"
            value={filters.check_in_to ?? ""}
            onChange={handleCheckInToChange}
            disabled={!adminModeEnabled}
          />
        </label>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-mist px-3 py-2 text-center">
          <p className="text-xs uppercase tracking-wider text-ink/70">Total</p>
          <p className="font-title text-lg text-ink">{totals.total}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
          <p className="text-xs uppercase tracking-wider text-emerald-700">Paid</p>
          <p className="font-title text-lg text-emerald-800">{totals.paid}</p>
        </div>
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-center">
          <p className="text-xs uppercase tracking-wider text-amber-700">Unpaid</p>
          <p className="font-title text-lg text-amber-800">{totals.unpaid}</p>
        </div>
      </div>

      {!adminModeEnabled ? (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Admin mode is disabled. Set <code>VITE_ADMIN_TOKEN</code> to load and
          manage reservations.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="max-h-[560px] overflow-auto rounded-xl border border-ink/10">
        <table className="min-w-full divide-y divide-ink/10">
          <thead className="sticky top-0 bg-sand">
            <tr>
              <th className="table-head">Guest</th>
              <th className="table-head">Stay</th>
              <th className="table-head">Guests</th>
              <th className="table-head">Payment</th>
              <th className="table-head">Created</th>
              <th className="table-head">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-ink/70">
                  Loading reservations...
                </td>
              </tr>
            ) : reservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-ink/70">
                  No reservations found for the selected filters.
                </td>
              </tr>
            ) : (
              reservations.map((reservation) => {
                const isBusy = busyReservationId === reservation.id;
                return (
                  <tr key={reservation.id}>
                    <td className="table-cell">
                      <p className="font-semibold text-ink">{reservation.guest_name}</p>
                      <p className="text-xs text-ink/70">{reservation.email}</p>
                      {reservation.phone ? (
                        <p className="text-xs text-ink/70">{reservation.phone}</p>
                      ) : null}
                    </td>
                    <td className="table-cell">
                      <p className="text-sm text-ink">
                        {formatDate(reservation.check_in_date)} -{" "}
                        {formatDate(reservation.check_out_date)}
                      </p>
                      {reservation.arrival_time ? (
                        <p className="text-xs text-ink/70">
                          Arrival: {reservation.arrival_time.slice(0, 5)}
                        </p>
                      ) : null}
                    </td>
                    <td className="table-cell">
                      <p className="text-sm text-ink">{reservation.guest_count}</p>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={reservation.payment_status} />
                      {reservation.total_amount ? (
                        <p className="mt-1 text-xs text-ink/70">
                          $
                          {Number(reservation.total_amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      ) : null}
                    </td>
                    <td className="table-cell text-xs text-ink/70">
                      {formatDateTime(reservation.created_at)}
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col gap-2">
                        <button
                          className="rounded-lg border border-ink/20 px-3 py-1 text-xs font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={isBusy || !adminModeEnabled}
                          onClick={() => {
                            void runAction(reservation.id, () =>
                              onToggleStatus(reservation)
                            );
                          }}
                        >
                          Mark as{" "}
                          {reservation.payment_status === "paid" ? "unpaid" : "paid"}
                        </button>
                        <button
                          className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={isBusy || !adminModeEnabled}
                          onClick={() => {
                            const confirmed = window.confirm(
                              "Delete this reservation permanently?"
                            );
                            if (!confirmed) {
                              return;
                            }
                            void runAction(reservation.id, () =>
                              onDelete(reservation.id)
                            );
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

