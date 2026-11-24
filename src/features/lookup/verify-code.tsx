import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Navigate, useNavigate } from '@tanstack/react-router'
import { Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { checkinApi } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { session } from '@/lib/session'
import { ErrorText } from '@/components/error-text'
import { ctaClass, PageTitle, StatusPill } from '@/components/layout'
import { FieldLabel } from './field'

export function VerifyCode() {
  const { t } = useI18n()
  const navigate = useNavigate()
  // read once: starting the session clears the pending lookup, which must not bounce us back to /
  const [lookup] = useState(() => session.get()?.lookup)
  const [code, setCode] = useState('')

  const verify = useMutation({
    mutationFn: () => checkinApi.verify(lookup!.lookup_token, code),
    onSuccess: (data) => {
      session.start('pnr', data.session_token)
      navigate({ to: '/flights' })
    },
  })
  const resend = useMutation({
    mutationFn: () => checkinApi.resendCode(lookup!.lookup_token),
    onSuccess: () => toast.success(t.resent),
  })

  if (!lookup) return <Navigate to='/' />

  return (
    <div>
      <StatusPill>{t.pillPublic}</StatusPill>
      <PageTitle
        title={t.verifyTitle}
        subtitle={t.verifySubtitle(lookup.email_hints.join(', '))}
      />
      <form
        className='oci-card space-y-5 p-5'
        onSubmit={(e) => {
          e.preventDefault()
          if (code.length === 4) verify.mutate()
        }}
      >
        <div>
          <FieldLabel icon={<MailCheck className='size-5' />} htmlFor='code'>
            {t.code}
          </FieldLabel>
          <input
            id='code'
            inputMode='numeric'
            autoComplete='one-time-code'
            autoFocus
            maxLength={4}
            placeholder='••••'
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, '').slice(0, 4))
            }
            className='oci-mono bg-foreground/[0.06] ring-foreground/10 h-12 w-full rounded-full text-center text-2xl font-bold tracking-[0.7em] ring-1 outline-none focus:ring-2 focus:ring-sky-400/70'
          />
        </div>
        <ErrorText error={verify.error ?? resend.error} />
        <button
          type='submit'
          className={ctaClass}
          disabled={code.length !== 4 || verify.isPending}
        >
          {verify.isPending && <Loader2 className='animate-spin' />}
          {t.verify}
        </button>
        <div className='flex justify-between text-sm font-semibold'>
          <button
            type='button'
            className='text-muted-foreground'
            onClick={() => navigate({ to: '/' })}
          >
            {t.back}
          </button>
          <button
            type='button'
            className='text-sky-600 dark:text-sky-300'
            disabled={resend.isPending}
            onClick={() => resend.mutate()}
          >
            {t.resend}
          </button>
        </div>
      </form>
    </div>
  )
}
