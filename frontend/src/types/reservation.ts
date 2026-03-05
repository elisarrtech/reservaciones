export type PaymentStatus = "paid" | "unpaid";

export interface Reservation {
  id: number;
  guest_name: string;
  email: string;
  phone: string | null;
  check_in_date: string;
  check_out_date: string;
  arrival_time: string | null;
  guest_count: number;
  payment_status: PaymentStatus;
  total_amount: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationCreateInput {
  guest_name: string;
  email: string;
  phone: string | null;
  check_in_date: string;
  check_out_date: string;
  arrival_time: string | null;
  guest_count: number;
  payment_status: PaymentStatus;
  total_amount: number | null;
  notes: string | null;
}

export interface ReservationUpdateInput {
  guest_name?: string;
  email?: string;
  phone?: string | null;
  check_in_date?: string;
  check_out_date?: string;
  arrival_time?: string | null;
  guest_count?: number;
  payment_status?: PaymentStatus;
  total_amount?: number | null;
  notes?: string | null;
}

export interface ReservationFilters {
  payment_status?: PaymentStatus;
  check_in_from?: string;
  check_in_to?: string;
}

