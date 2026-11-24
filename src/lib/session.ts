/**
 * Check-in state kept in sessionStorage (one browser tab = one check-in).
 *   entry   which door the visitor came in by: `ot` (/ot, SAP number) or `pnr` (/, PNR + OTP)
 *   lookup  PNR lookup waiting for its e-mailed code
 *   token   session token after the SAP lookup or the code (X-Checkin-Token)
 */
export type Entry = 'ot' | 'pnr'

export interface PendingLookup {
  lookup_token: string
  email_hints: string[]
}

interface CheckinSession {
  entry: Entry
  lookup?: PendingLookup
  token?: string
}

const KEY = 'oci-session'

function read(): CheckinSession | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CheckinSession) : null
  } catch {
    return null
  }
}

function write(value: CheckinSession | null) {
  try {
    if (value) sessionStorage.setItem(KEY, JSON.stringify(value))
    else sessionStorage.removeItem(KEY)
  } catch {
    // private mode: the check-in still works until the tab is reloaded
  }
  memory = value
}

let memory: CheckinSession | null = read()

export const session = {
  get: () => memory,
  token: () => memory?.token ?? null,
  entry: (): Entry => memory?.entry ?? 'pnr',
  startPending: (entry: Entry, lookup: PendingLookup) =>
    write({ entry, lookup }),
  start: (entry: Entry, token: string) => write({ entry, token }),
  clear: () => write(memory ? { entry: memory.entry } : null),
}

/** Where "start again" leads: the door the visitor came in by. */
export function entryPath(entry: Entry = session.entry()) {
  return entry === 'ot' ? '/ot' : '/'
}
