import axios, { AxiosError } from 'axios'
import { env } from '@/config/env'
import { session } from './session'

/** flightmode-api public online check-in: `${VITE_API_URL}/checkin/...` */
const http = axios.create({
  baseURL: `${env.VITE_API_URL.replace(/\/+$/, '')}/checkin`,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = session.token()
  if (token) config.headers.set('X-Checkin-Token', token)
  return config
})

/** API error with the backend's business-rule `code` (e.g. `booking_not_found`). */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    /** business-rule details, e.g. when online check-in opens */
    public context: Record<string, unknown> = {}
  ) {
    super(message)
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0
    const body = error.response?.data as
      | {
          message?: string
          code?: string
          context?: Record<string, unknown> | null
          errors?: Record<string, string[]>
        }
      | undefined
    if (!error.response) return new ApiError(error.message, 'network', 0)
    if (status === 429)
      return new ApiError('Too many attempts', 'too_many', 429)
    const firstFieldError = body?.errors
      ? Object.values(body.errors)[0]?.[0]
      : undefined
    return new ApiError(
      firstFieldError ?? body?.message ?? error.message,
      body?.code ?? (status === 422 ? 'validation' : 'unknown'),
      status,
      body?.context ?? {}
    )
  }
  return new ApiError(String(error), 'unknown', 0)
}

async function call<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  try {
    return (await promise).data.data
  } catch (error) {
    throw toApiError(error)
  }
}

export interface FlightSummary {
  flight_id: number
  flight_number: string
  origin: string
  origin_city: string | null
  destination: string
  destination_city: string | null
  departure_at: string
  /** at the departure airport: "2026-11-26 09:00" */
  departure_local: string
  checkin_closes_local: string
  aircraft_type: string | null
  passengers: {
    name: string
    is_checked_in: boolean
    seat_number: string | null
    cabin_class: string
  }[]
}

export interface FlightPassenger {
  segment_id: number
  name: string
  type: string | null
  cabin_class: string
  seat_number: string | null
  is_checked_in: boolean
  infant: string | null
}

export type SeatState =
  'available' | 'occupied' | 'blocked' | 'held' | 'restricted'

export interface Seat {
  seat_number: string
  row: number
  column: string
  side: 'left' | 'middle' | 'right'
  seat_type: string
  cabin_class: string
  zone?: string
  is_emergency_exit: boolean
  state: SeatState
  price?: string
}

export interface SeatMap {
  flight_id: number
  layout: { left: string[]; middle: string[]; right: string[] }
  rows: number[]
  seats: Seat[]
}

export interface Policy {
  id: number
  type: string
  title: string
  body: string
}

export interface BoardingPass {
  segment_id: number
  airline: { name: string; iata_code: string | null; logo_url: string | null }
  passenger: { name: string; type: string }
  pnr: string
  flight_number: string
  origin: { code: string; name: string; city: string | null }
  destination: { code: string; name: string; city: string | null }
  departure_date: string
  departure_time: string
  arrival_time: string
  boarding_time: string
  gate: string | null
  terminal: string | null
  seat_number: string
  seat_type: string | null
  cabin_class: string
  boarding_sequence: number | null
  infant: { name: string } | null
  barcode: string
}

export const checkinApi = {
  lookupBySap: (person_code: string) =>
    call<{ session_token: string; flights: FlightSummary[] }>(
      http.post('lookup/sap', { person_code })
    ),
  lookupByPnr: (pnr: string, last_name: string) =>
    call<{
      lookup_token: string
      email_hints: string[]
      flights: FlightSummary[]
    }>(http.post('lookup/pnr', { pnr, last_name })),
  resendCode: async (lookup_token: string) => {
    try {
      await http.post('verification-code', { lookup_token })
    } catch (error) {
      throw toApiError(error)
    }
  },
  verify: (lookup_token: string, code: string) =>
    call<{ session_token: string }>(
      http.post('verify', { lookup_token, code })
    ),

  flights: () => call<FlightSummary[]>(http.get('flights')),
  passengers: (flightId: number) =>
    call<{
      is_domestic: boolean
      online_checkin_open: boolean
      passengers: FlightPassenger[]
    }>(http.get(`flights/${flightId}/passengers`)),
  seatMap: (flightId: number) =>
    call<SeatMap>(http.get(`flights/${flightId}/seat-map`)),
  holdSeat: async (flightId: number, seat_number: string) => {
    try {
      await http.post(`flights/${flightId}/seat-hold`, { seat_number })
    } catch (error) {
      throw toApiError(error)
    }
  },
  /** Let go of a seat this session was holding (another seat was chosen, or the passenger was unticked). */
  releaseSeat: async (flightId: number, seat_number: string) => {
    try {
      await http.delete(
        `flights/${flightId}/seat-hold/${encodeURIComponent(seat_number)}`
      )
    } catch {
      // the hold expires by itself after a few minutes
    }
  },
  policies: (flightId: number, locale: string) =>
    call<{ cabin: Policy[]; checked: Policy[] }>(
      http.get(`flights/${flightId}/policies`, { params: { locale } })
    ),
  checkIn: (
    flightId: number,
    passengers: { segment_id: number; seat_number?: string | null }[]
  ) =>
    call<BoardingPass[]>(
      http.post(`flights/${flightId}/check-in`, {
        passengers,
        accept_policies: true,
      })
    ),
  boardingPasses: (flightId: number) =>
    call<BoardingPass[]>(http.get(`flights/${flightId}/boarding-passes`)),
}
