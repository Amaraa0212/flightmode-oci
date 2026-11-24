import dayjs from 'dayjs'

/** Departure as shown to the passenger (browser time; the boarding pass shows the airport's local time). */
export function formatDeparture(iso: string) {
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}
