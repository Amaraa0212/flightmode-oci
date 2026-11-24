import { Fragment, useMemo } from 'react'
import { Asterisk, Check, Plane, X } from 'lucide-react'
import { type Seat, type SeatMap as SeatMapData } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface Props {
  map: SeatMapData
  /** seat → initials of the passenger of this check-in who has it */
  mine: Record<string, string>
  /** seat currently chosen for the active passenger */
  active?: string | null
  onPick: (seat: Seat) => void
  disabled?: boolean
}

/** Paid seats are sold at the counter only; online they cannot be picked. */
function isPickable(seat: Seat) {
  return seat.state === 'available' && !seat.price
}

export function SeatMap({ map, mine, active, onPick, disabled }: Props) {
  const { t } = useI18n()
  const bySeat = useMemo(
    () => new Map(map.seats.map((s) => [`${s.row}${s.column}`, s])),
    [map.seats]
  )
  const groups = [map.layout.left, map.layout.middle, map.layout.right].filter(
    (g) => g.length > 0
  )
  const exitRows = useMemo(
    () =>
      new Set(map.seats.filter((s) => s.is_emergency_exit).map((s) => s.row)),
    [map.seats]
  )
  const columns = groups.reduce((n, g) => n + g.length, 0) + groups.length - 1

  // the first row of each run of exit rows gets the banner: "14–15"
  const exitRunLabel = (row: number) => {
    let last = row
    while (exitRows.has(last + 1)) last++
    return last === row ? `${row}` : `${row}–${last}`
  }

  return (
    <div className='space-y-3'>
      <Legend />
      <div className='bg-foreground/[0.05] ring-foreground/10 overflow-x-auto rounded-3xl p-2 ring-1'>
        <div className='bg-foreground/8 mx-auto mb-2 flex h-8 w-24 items-center justify-center rounded-t-full'>
          <Plane className='text-muted-foreground size-4 -rotate-45' />
        </div>
        <table className='mx-auto border-separate border-spacing-1'>
          <thead>
            <tr>
              {groups.map((group, gi) => (
                <Fragment key={gi}>
                  {gi > 0 && <th className='w-7' />}
                  {group.map((col) => (
                    <th
                      key={col}
                      className='oci-mono text-muted-foreground text-xs font-semibold'
                    >
                      {col}
                    </th>
                  ))}
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {map.rows.map((row) => {
              const exit = exitRows.has(row)
              const bannerHere = exit && !exitRows.has(row - 1)
              return (
                <Fragment key={row}>
                  {bannerHere && (
                    <tr>
                      <td colSpan={columns}>
                        <div className='oci-mono flex items-center gap-2 rounded-xl bg-amber-400/12 px-3 py-2 text-[0.7rem] font-bold tracking-wider text-amber-600 uppercase dark:text-amber-300'>
                          <Asterisk className='size-4 shrink-0' />
                          {t.exitRows} ({exitRunLabel(row)})
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    {groups.map((group, gi) => (
                      <Fragment key={gi}>
                        {gi > 0 && (
                          <td
                            className={cn(
                              'oci-mono w-7 text-center text-xs font-bold',
                              exit
                                ? 'text-amber-500 dark:text-amber-400'
                                : 'text-sky-600/80 dark:text-sky-300/80'
                            )}
                          >
                            {gi === 1 ? String(row).padStart(2, '0') : ''}
                          </td>
                        )}
                        {group.map((col) => {
                          const seat = bySeat.get(`${row}${col}`)
                          if (!seat) return <td key={col} />
                          const owner = mine[seat.seat_number]
                          const pickable = isPickable(seat) && !owner
                          const isActive = seat.seat_number === active
                          return (
                            <td key={col}>
                              <button
                                type='button'
                                disabled={disabled || (!pickable && !isActive)}
                                onClick={() => onPick(seat)}
                                aria-label={seat.seat_number}
                                aria-pressed={isActive}
                                className={cn(
                                  'oci-mono flex size-10 items-center justify-center rounded-xl text-[0.7rem] font-bold transition',
                                  pickable &&
                                    'bg-foreground/8 text-foreground/80 hover:bg-sky-400/20',
                                  !pickable &&
                                    !owner &&
                                    'text-muted-foreground/40',
                                  owner &&
                                    'bg-sky-400/25 text-sky-700 ring-1 ring-sky-400/60 dark:text-sky-200',
                                  isActive &&
                                    'bg-sky-300 text-[#06162a] ring-2 ring-sky-400 dark:ring-sky-200'
                                )}
                              >
                                {owner ? (
                                  isActive ? (
                                    seat.seat_number
                                  ) : (
                                    owner
                                  )
                                ) : pickable ? (
                                  seat.seat_number
                                ) : (
                                  <X className='size-4' />
                                )}
                              </button>
                            </td>
                          )
                        })}
                      </Fragment>
                    ))}
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Legend() {
  const { t } = useI18n()
  return (
    <div className='oci-inset text-muted-foreground flex flex-wrap justify-around gap-3 px-3 py-2.5 text-sm'>
      <span className='flex items-center gap-2'>
        <span className='bg-foreground/8 size-5 rounded-md' />
        {t.seatAvailable}
      </span>
      <span className='flex items-center gap-2'>
        <span className='flex size-5 items-center justify-center rounded-md bg-sky-300 text-[#06162a]'>
          <Check className='size-3.5' />
        </span>
        {t.seatSelected}
      </span>
      <span className='flex items-center gap-2'>
        <X className='size-4' />
        {t.seatTaken}
      </span>
    </div>
  )
}
