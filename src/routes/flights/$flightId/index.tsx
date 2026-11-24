import { createFileRoute } from '@tanstack/react-router'
import { CheckinPage } from '@/features/checkin/checkin-page'

export const Route = createFileRoute('/flights/$flightId/')({
  component: CheckinPageRoute,
})

function CheckinPageRoute() {
  const { flightId } = Route.useParams()
  return <CheckinPage flightId={Number(flightId)} />
}
