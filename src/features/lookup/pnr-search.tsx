import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, Search, Ticket, User } from 'lucide-react'
import { checkinApi } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { session } from '@/lib/session'
import { ErrorText } from '@/components/error-text'
import { ctaClass, PageTitle, StatusPill } from '@/components/layout'
import { FieldLabel, Hint, PillInput } from './field'

/** Public door (/): PNR + last name, then the code e-mailed to the booking's stored address. */
export function PnrSearch() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [pnr, setPnr] = useState('')
  const [lastName, setLastName] = useState('')
  const ready = pnr.trim().length >= 5 && lastName.trim().length > 0

  const lookup = useMutation({
    mutationFn: () => checkinApi.lookupByPnr(pnr.trim(), lastName.trim()),
    onSuccess: (data) => {
      session.startPending('pnr', {
        lookup_token: data.lookup_token,
        email_hints: data.email_hints,
      })
      navigate({ to: '/verify' })
    },
  })

  return (
    <div>
      <StatusPill>{t.pillPublic}</StatusPill>
      <PageTitle title={t.pnrTitle} subtitle={t.pnrSubtitle} />

      <form
        className='oci-card space-y-5 p-5'
        onSubmit={(e) => {
          e.preventDefault()
          if (ready) lookup.mutate()
        }}
      >
        <div>
          <FieldLabel icon={<Ticket className='size-5' />} htmlFor='pnr'>
            {t.pnr}
          </FieldLabel>
          <PillInput
            id='pnr'
            autoComplete='off'
            autoCapitalize='characters'
            autoFocus
            maxLength={8}
            placeholder={t.pnrPlaceholder}
            value={pnr}
            onChange={(e) => setPnr(e.target.value.toUpperCase())}
            onPasteText={(v) => setPnr(v.toUpperCase())}
            pasteLabel={t.paste}
            className='oci-mono tracking-[0.2em] uppercase'
          />
          <Hint>{t.pnrHint}</Hint>
        </div>
        <div>
          <FieldLabel icon={<User className='size-5' />} htmlFor='last-name'>
            {t.lastName}
          </FieldLabel>
          <PillInput
            id='last-name'
            autoComplete='family-name'
            autoCapitalize='characters'
            maxLength={100}
            placeholder={t.lastNamePlaceholder}
            value={lastName}
            onChange={(e) => setLastName(e.target.value.toUpperCase())}
            className='uppercase'
          />
        </div>
        <ErrorText error={lookup.error} />
        <button
          type='submit'
          className={ctaClass}
          disabled={!ready || lookup.isPending}
        >
          {lookup.isPending ? <Loader2 className='animate-spin' /> : null}
          {t.search}
          {!lookup.isPending && <Search className='size-5' />}
        </button>
      </form>
    </div>
  )
}
