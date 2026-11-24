import { type QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from '@tanstack/react-router'
import { useTheme } from '@/lib/theme'
import { Toaster } from '@/components/ui/sonner'
import { Shell } from '@/components/layout'

function ThemedToaster() {
  const [theme] = useTheme()
  return <Toaster duration={5000} position='top-center' theme={theme} />
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: () => (
      <Shell>
        <Outlet />
        <ThemedToaster />
      </Shell>
    ),
    notFoundComponent: () => (
      <div className='py-16 text-center'>
        <p className='text-muted-foreground'>404</p>
        <Link to='/' className='text-primary underline'>
          ←
        </Link>
      </div>
    ),
  }
)
