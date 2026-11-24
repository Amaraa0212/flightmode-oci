import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, Clock } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { entryPath, session } from '@/lib/session'
import { Alert, AlertDescription } from '@/components/ui/alert'

/** Localised text for an API error (falls back to the server's message). */
// eslint-disable-next-line react-refresh/only-export-components
export function useErrorText() {
  const { t } = useI18n()
  return (error: unknown) => {
    if (
      error instanceof ApiError &&
      error.code === 'online_checkin_not_open_yet'
    ) {
      // departure airport's clock: "2026-11-28 09:00"
      const { flight_number, opens_at_local } = error.context as {
        flight_number: string
        opens_at_local: string
      }
      return t.notOpenYet(flight_number, opens_at_local)
    }
    if (error instanceof ApiError) return t.errors[error.code] ?? error.message
    return t.errors.unknown
  }
}

/** Inline error; an expired session sends the visitor back to the door they came in by. */
export function ErrorText({ error }: { error: unknown }) {
  const text = useErrorText()
  const navigate = useNavigate()
  const expired = error instanceof ApiError && error.code === 'session_expired'

  useEffect(() => {
    if (!expired) return
    const to = entryPath()
    session.clear()
    const timer = setTimeout(() => navigate({ to }), 2500)
    return () => clearTimeout(timer)
  }, [expired, navigate])

  if (!error) return null
  // not an error: the flight is there, its online check-in just opens later
  const later =
    error instanceof ApiError && error.code === 'online_checkin_not_open_yet'
  return (
    <Alert variant={later ? 'default' : 'destructive'}>
      {later ? <Clock /> : <AlertCircle />}
      <AlertDescription>{text(error)}</AlertDescription>
    </Alert>
  )
}
