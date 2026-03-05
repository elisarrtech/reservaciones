import type {
  Reservation,
  ReservationCreateInput,
  ReservationFilters,
  ReservationUpdateInput
} from "../types/reservation";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN ?? "";

class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  useAdminToken = false
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (useAdminToken) {
    if (!ADMIN_TOKEN) {
      throw new ApiError(
        "Missing VITE_ADMIN_TOKEN. Configure it to access admin endpoints.",
        401
      );
    }
    headers.set("X-Admin-Token", ADMIN_TOKEN);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) {
        message = body.detail;
      }
    } catch {
      // Keep default error message.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

function buildQueryParams(filters: ReservationFilters): string {
  const params = new URLSearchParams();
  if (filters.payment_status) {
    params.set("payment_status", filters.payment_status);
  }
  if (filters.check_in_from) {
    params.set("check_in_from", filters.check_in_from);
  }
  if (filters.check_in_to) {
    params.set("check_in_to", filters.check_in_to);
  }
  return params.toString();
}

export async function createReservation(
  payload: ReservationCreateInput
): Promise<Reservation> {
  return request<Reservation>("/public/reservations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function listReservations(
  filters: ReservationFilters
): Promise<Reservation[]> {
  const queryString = buildQueryParams(filters);
  const suffix = queryString ? `?${queryString}` : "";
  return request<Reservation[]>(`/admin/reservations${suffix}`, {}, true);
}

export async function updateReservation(
  reservationId: number,
  payload: ReservationUpdateInput
): Promise<Reservation> {
  return request<Reservation>(
    `/admin/reservations/${reservationId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    },
    true
  );
}

export async function deleteReservation(reservationId: number): Promise<void> {
  await request<void>(
    `/admin/reservations/${reservationId}`,
    {
      method: "DELETE"
    },
    true
  );
}

export { ApiError };

