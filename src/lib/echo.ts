import { env } from '@/config/env'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

/**
 * Laravel Reverb client for the public seat-map channel (no auth).
 * Null when no Reverb key is configured: the seat map then only polls.
 */
let echo: Echo<'reverb'> | null | undefined

export function getEcho(): Echo<'reverb'> | null {
  if (echo !== undefined) return echo
  if (!env.VITE_REVERB_APP_KEY) return (echo = null)

  ;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

  echo = new Echo({
    broadcaster: 'reverb',
    key: env.VITE_REVERB_APP_KEY,
    wsHost: env.VITE_REVERB_HOST ?? window.location.hostname,
    wsPort: env.VITE_REVERB_PORT,
    wssPort: env.VITE_REVERB_PORT,
    forceTLS: env.VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
  })
  return echo
}
