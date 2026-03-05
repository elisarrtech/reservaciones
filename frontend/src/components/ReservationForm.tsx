import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";

import type { PaymentStatus, ReservationCreateInput } from "../types/reservation";

interface ReservationFormProps {
  onCreate: (payload: ReservationCreateInput) => Promise<void>;
}

interface ReservationFormState {
  guest_name: string;
  email: string;
  phone: string;
  check_in_date: string;
  check_out_date: string;
  arrival_time: string;
  guest_count: string;
  payment_status: PaymentStatus;
  total_amount: string;
  notes: string;
}

type FormAlert =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

const FORM_FIELD_NAMES: ReadonlyArray<keyof ReservationFormState> = [
  "guest_name",
  "email",
  "phone",
  "check_in_date",
  "check_out_date",
  "arrival_time",
  "guest_count",
  "payment_status",
  "total_amount",
  "notes"
];

function isFormFieldName(value: string): value is keyof ReservationFormState {
  return FORM_FIELD_NAMES.includes(value as keyof ReservationFormState);
}

function toDateInputValue(input: Date): string {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, "0");
  const day = String(input.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildInitialState(): ReservationFormState {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    guest_name: "",
    email: "",
    phone: "",
    check_in_date: toDateInputValue(today),
    check_out_date: toDateInputValue(tomorrow),
    arrival_time: "15:00",
    guest_count: "2",
    payment_status: "unpaid",
    total_amount: "",
    notes: ""
  };
}

export function ReservationForm({ onCreate }: ReservationFormProps): JSX.Element {
  const [form, setForm] = useState<ReservationFormState>(() => buildInitialState());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<FormAlert>(null);

  const nightsLabel = useMemo(() => {
    if (!form.check_in_date || !form.check_out_date) {
      return "Select dates";
    }
    const checkIn = new Date(form.check_in_date);
    const checkOut = new Date(form.check_out_date);
    const diffInMs = checkOut.getTime() - checkIn.getTime();
    if (diffInMs <= 0) {
      return "Invalid date range";
    }
    const nights = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    return `${nights} night${nights === 1 ? "" : "s"}`;
  }, [form.check_in_date, form.check_out_date]);

  function handleFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void {
    const { name, value } = event.target;
    if (!isFormFieldName(name)) {
      return;
    }

    if (name === "payment_status") {
      setForm((prev) => ({
        ...prev,
        payment_status: value as PaymentStatus
      }));
      return;
    }

    const textField = name as Exclude<keyof ReservationFormState, "payment_status">;
    setForm((prev) => ({ ...prev, [textField]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAlert(null);

    if (new Date(form.check_out_date) <= new Date(form.check_in_date)) {
      setAlert({
        type: "error",
        message: "Check-out date must be after check-in date."
      });
      return;
    }

    const guestCount = Number(form.guest_count);
    if (!Number.isInteger(guestCount) || guestCount < 1) {
      setAlert({
        type: "error",
        message: "Guest count must be a valid positive number."
      });
      return;
    }

    const totalAmount = form.total_amount.trim()
      ? Number(form.total_amount)
      : null;
    if (totalAmount !== null && Number.isNaN(totalAmount)) {
      setAlert({
        type: "error",
        message: "Total amount must be a valid number."
      });
      return;
    }

    const payload: ReservationCreateInput = {
      guest_name: form.guest_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      check_in_date: form.check_in_date,
      check_out_date: form.check_out_date,
      arrival_time: form.arrival_time || null,
      guest_count: guestCount,
      payment_status: form.payment_status,
      total_amount: totalAmount,
      notes: form.notes.trim() || null
    };

    setIsSubmitting(true);
    try {
      await onCreate(payload);
      setAlert({ type: "success", message: "Reservation created successfully." });
      setForm((prev) => ({
        ...buildInitialState(),
        check_in_date: prev.check_in_date,
        check_out_date: prev.check_out_date
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Reservation could not be created.";
      setAlert({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl bg-white/90 p-6 shadow-panel backdrop-blur-sm md:p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-title text-xs uppercase tracking-[0.28em] text-coral">
            New Reservation
          </p>
          <h2 className="font-title text-2xl text-ink">Guest Booking Form</h2>
        </div>
        <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-ink">
          {nightsLabel}
        </span>
      </div>

      {alert ? (
        <p
          className={[
            "mb-4 rounded-xl px-4 py-3 text-sm",
            alert.type === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-700"
          ].join(" ")}
        >
          {alert.message}
        </p>
      ) : null}

      <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="col-span-1 flex flex-col gap-1 md:col-span-2">
          <span className="text-sm font-semibold text-ink">Guest full name</span>
          <input
            className="field"
            name="guest_name"
            value={form.guest_name}
            onChange={handleFieldChange}
            maxLength={120}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">Email</span>
          <input
            className="field"
            type="email"
            name="email"
            value={form.email}
            onChange={handleFieldChange}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">Phone</span>
          <input
            className="field"
            name="phone"
            value={form.phone}
            onChange={handleFieldChange}
            maxLength={30}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">Check-in</span>
          <input
            className="field"
            type="date"
            name="check_in_date"
            value={form.check_in_date}
            onChange={handleFieldChange}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">Check-out</span>
          <input
            className="field"
            type="date"
            name="check_out_date"
            value={form.check_out_date}
            onChange={handleFieldChange}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">Arrival time</span>
          <input
            className="field"
            type="time"
            name="arrival_time"
            value={form.arrival_time}
            onChange={handleFieldChange}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">Guests</span>
          <input
            className="field"
            type="number"
            name="guest_count"
            value={form.guest_count}
            min={1}
            max={20}
            onChange={handleFieldChange}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">Payment status</span>
          <select
            className="field"
            name="payment_status"
            value={form.payment_status}
            onChange={handleFieldChange}
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">Total amount</span>
          <input
            className="field"
            type="number"
            name="total_amount"
            value={form.total_amount}
            min={0}
            step="0.01"
            onChange={handleFieldChange}
            placeholder="Optional"
          />
        </label>

        <label className="col-span-1 flex flex-col gap-1 md:col-span-2">
          <span className="text-sm font-semibold text-ink">Notes</span>
          <textarea
            className="field min-h-[120px]"
            name="notes"
            value={form.notes}
            onChange={handleFieldChange}
            maxLength={1000}
            placeholder="Special requests, allergies, transfer notes, etc."
          />
        </label>

        <button
          className="col-span-1 mt-2 rounded-xl bg-ink px-4 py-3 font-semibold text-white transition hover:bg-pine disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Create reservation"}
        </button>
      </form>
    </section>
  );
}
