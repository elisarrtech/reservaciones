import { useCallback, useEffect, useState } from "react";

import { ReservationForm } from "./components/ReservationForm";
import { ReservationTable } from "./components/ReservationTable";
import {
  ApiError,
  createReservation,
  deleteReservation,
  listReservations,
  updateReservation
} from "./services/api";
import type {
  Reservation,
  ReservationCreateInput,
  ReservationFilters
} from "./types/reservation";

const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN ?? "";

function normalizeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error.";
}

export default function App(): JSX.Element {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filters, setFilters] = useState<ReservationFilters>({});
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  const adminModeEnabled = Boolean(ADMIN_TOKEN);

  const loadReservations = useCallback(async (): Promise<void> => {
    if (!adminModeEnabled) {
      setReservations([]);
      return;
    }

    setIsLoadingReservations(true);
    try {
      const data = await listReservations(filters);
      setReservations(data);
    } catch (error) {
      setStatusType("error");
      setStatusMessage(normalizeError(error));
    } finally {
      setIsLoadingReservations(false);
    }
  }, [adminModeEnabled, filters]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  async function handleCreateReservation(
    payload: ReservationCreateInput
  ): Promise<void> {
    await createReservation(payload);
    setStatusType("success");
    setStatusMessage("Reservation created and synced.");
    if (adminModeEnabled) {
      await loadReservations();
    }
  }

  async function handleToggleStatus(reservation: Reservation): Promise<void> {
    const nextStatus = reservation.payment_status === "paid" ? "unpaid" : "paid";
    await updateReservation(reservation.id, { payment_status: nextStatus });
    setStatusType("success");
    setStatusMessage(`Reservation #${reservation.id} marked as ${nextStatus}.`);
    await loadReservations();
  }

  async function handleDeleteReservation(reservationId: number): Promise<void> {
    await deleteReservation(reservationId);
    setStatusType("success");
    setStatusMessage(`Reservation #${reservationId} deleted.`);
    await loadReservations();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sand via-white to-mist pb-10 font-body text-ink">
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 md:px-8 md:pt-12">
        <header className="mb-8 overflow-hidden rounded-3xl border border-ink/10 bg-ink px-6 py-8 text-white shadow-panel md:px-10">
          <p className="font-title text-xs uppercase tracking-[0.3em] text-coral">
            Hotel Operations
          </p>
          <h1 className="mt-2 font-title text-3xl md:text-5xl">
            Reservation Suite Premium
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-white/80 md:text-base">
            FastAPI + React control panel with Google Drive automatic backup.
            Capture bookings, track payment status, and manage reservations in one
            professional workflow.
          </p>
        </header>

        {statusMessage ? (
          <div
            className={[
              "mb-6 rounded-2xl px-4 py-3 text-sm",
              statusType === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-rose-50 text-rose-700"
            ].join(" ")}
            role="status"
          >
            {statusMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.03fr_1fr]">
          <ReservationForm onCreate={handleCreateReservation} />
          <ReservationTable
            reservations={reservations}
            filters={filters}
            isLoading={isLoadingReservations}
            adminModeEnabled={adminModeEnabled}
            onFiltersChange={setFilters}
            onRefresh={loadReservations}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteReservation}
          />
        </div>
      </div>
    </main>
  );
}
