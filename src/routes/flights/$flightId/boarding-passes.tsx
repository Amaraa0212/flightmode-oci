import { createFileRoute } from '@tanstack/react-router'
import { BoardingPassesPage } from '@/features/checkin/boarding-passes-page'

export const Route = createFileRoute('/flights/$flightId/boarding-passes')({
  component: BoardingPassesPageRoute,
})

function BoardingPassesPageRoute() {
  const { flightId } = Route.useParams()
  return <BoardingPassesPage flightId={Number(flightId)} />
}
