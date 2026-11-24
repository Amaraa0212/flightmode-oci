import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { type SeatMap, type SeatState } from '@/lib/api'
import { getEcho } from '@/lib/echo'

interface SeatsChanged {
  seats: { seat_number: string; state: 'occupied' | 'held' | 'released' }[]
}

/**
 * Keeps the online seat map current while the visitor is choosing:
 *   occupied / held  → greyed out at once (never makes a seat pickable, so it is safe to apply locally)
 *   released         → reload the map: whether a freed seat is open online depends on zones and exits
 * Seats this visitor holds stay theirs (the server already shows them as available to their own session).
 */
export function useLiveSeats(
  flightId: number,
  queryKey: unknown[],
  /** seats this visitor holds or is claiming right now (the server's "held" event can beat the hold's own response) */
  isOwn: (seat: string) => boolean
) {
  const queryClient = useQueryClient()
  const own = useRef(isOwn)
  useEffect(() => {
    own.current = isOwn
  }, [isOwn])

  const key = JSON.stringify(queryKey)

  useEffect(() => {
    const echo = getEcho()
    if (!echo) return
    const queryKey = JSON.parse(key) as unknown[]
    let reload: ReturnType<typeof setTimeout> | undefined
    const channel = `oci.flight.${flightId}`

    echo.channel(channel).listen('.seats.changed', (event: SeatsChanged) => {
      const taken = new Map(
        event.seats
          .filter((s) => s.state !== 'released' && !own.current(s.seat_number))
          // released ones are filtered out above
          .map((s) => [s.seat_number, s.state as SeatState] as const)
      )
      if (taken.size > 0) {
        queryClient.setQueryData<SeatMap>(
          queryKey,
          (map) =>
            map && {
              ...map,
              seats: map.seats.map((seat) => {
                const state = taken.get(seat.seat_number)
                return state && seat.state === 'available'
                  ? { ...seat, state }
                  : seat
              }),
            }
        )
      }
      if (event.seats.some((s) => s.state === 'released')) {
        clearTimeout(reload)
        // several seats are often freed at once (a group offloaded): one reload for all of them
        reload = setTimeout(
          () => queryClient.invalidateQueries({ queryKey }),
          800
        )
      }
    })

    return () => {
      clearTimeout(reload)
      echo.leaveChannel(channel)
    }
  }, [flightId, key, queryClient])
}
