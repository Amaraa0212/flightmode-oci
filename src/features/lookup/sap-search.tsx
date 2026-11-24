import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Hash, IdCard, Loader2, Search } from 'lucide-react'
import { checkinApi } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { session } from '@/lib/session'
import { ErrorText } from '@/components/error-text'
import { ctaClass, PageTitle, StatusPill } from '@/components/layout'
import { FieldLabel, Hint, PillInput } from './field'

/** Oyu Tolgoi door (/ot): the SAP number alone opens the check-in, no further check. */
export function SapSearch() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [personCode, setPersonCode] = useState('')

  const lookup = useMutation({
    mutationFn: () => checkinApi.lookupBySap(personCode.trim()),
    onSuccess: (data) => {
      session.start('ot', data.session_token)
      queryClient.setQueryData(['flights', data.session_token], data.flights)
      navigate({ to: '/flights' })
    },
  })

  return (
    <div>
      <StatusPill>{t.pillOt}</StatusPill>
      <PageTitle title={t.otTitle} subtitle={t.otSubtitle} />

      <form
        className='oci-card space-y-5 p-5'
        onSubmit={(e) => {
          e.preventDefault()
          if (personCode.trim()) lookup.mutate()
        }}
      >
        <div>
          <FieldLabel icon={<IdCard className='size-5' />} htmlFor='sap'>
            {t.sapNumber}
          </FieldLabel>
          <PillInput
            id='sap'
            icon={<Hash className='size-5' />}
            inputMode='numeric'
            autoComplete='off'
            autoFocus
            maxLength={20}
            placeholder={t.sapPlaceholder}
            value={personCode}
            onChange={(e) => setPersonCode(e.target.value)}
            onPasteText={setPersonCode}
            pasteLabel={t.paste}
          />
          <Hint>{t.sapHint}</Hint>
        </div>
        <ErrorText error={lookup.error} />
        <button
          type='submit'
          className={ctaClass}
          disabled={!personCode.trim() || lookup.isPending}
        >
          {lookup.isPending ? <Loader2 className='animate-spin' /> : null}
          {t.search}
          {!lookup.isPending && <Search className='size-5' />}
        </button>
      </form>
    </div>
  )
}
