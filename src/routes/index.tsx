import { createFileRoute } from '@tanstack/react-router'
import { PnrSearch } from '@/features/lookup/pnr-search'

export const Route = createFileRoute('/')({ component: PnrSearch })
