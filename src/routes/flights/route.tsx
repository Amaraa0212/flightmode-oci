import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { entryPath, session } from '@/lib/session'

/** Everything under /flights needs a check-in session. */
export const Route = createFileRoute('/flights')({
  beforeLoad: () => {
    if (!session.token()) throw redirect({ to: entryPath() })
  },
  component: Outlet,
})
