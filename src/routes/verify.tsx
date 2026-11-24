import { createFileRoute } from '@tanstack/react-router'
import { VerifyCode } from '@/features/lookup/verify-code'

export const Route = createFileRoute('/verify')({ component: VerifyCode })
