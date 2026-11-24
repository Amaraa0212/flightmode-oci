import { createFileRoute } from '@tanstack/react-router'
import { FlightList } from '@/features/flights/flight-list'

export const Route = createFileRoute('/flights/')({ component: FlightList })
