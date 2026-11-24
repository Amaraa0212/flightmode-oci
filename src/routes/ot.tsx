import { createFileRoute } from '@tanstack/react-router'
import { SapSearch } from '@/features/lookup/sap-search'

/** Oyu Tolgoi entry: SAP number lookup. */
export const Route = createFileRoute('/ot')({ component: SapSearch })
