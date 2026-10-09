import { createRootRoute, createRoute, createRouter, lazyRouteComponent } from '@tanstack/react-router';
import { AppShell } from './components/AppShell';
import { parseSearch, stringifySearch } from './lib/search';
import { CategoryPage } from './pages/CategoryPage';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { RouteError } from './pages/RouteError';
import { ToolPage } from './pages/ToolPage';

const rootRoute = createRootRoute({ component: AppShell, notFoundComponent: NotFound, errorComponent: RouteError });

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home });

const toolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/t/$toolId',
  validateSearch: (search: Record<string, unknown>): { input?: string } =>
    typeof search.input === 'string' ? { input: search.input } : {},
  component: function ToolRoute() {
    const { toolId } = toolRoute.useParams();
    return <ToolPage key={toolId} toolId={toolId} />;
  },
});

const categoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/c/$category',
  component: function CategoryRoute() {
    const { category } = categoryRoute.useParams();
    return <CategoryPage category={category} />;
  },
});

const supportRoute = createRoute({ getParentRoute: () => rootRoute, path: '/support', component: lazyRouteComponent(() => import('./pages/Support'), 'Support') });
const savedRoute = createRoute({ getParentRoute: () => rootRoute, path: '/saved', component: lazyRouteComponent(() => import('./pages/Saved'), 'Saved') });
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: lazyRouteComponent(() => import('./pages/Settings'), 'Settings') });
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: lazyRouteComponent(() => import('./pages/About'), 'About') });

const routeTree = rootRoute.addChildren([
  homeRoute,
  toolRoute,
  categoryRoute,
  savedRoute,
  settingsRoute,
  aboutRoute,
  supportRoute,
]);

export const router = createRouter({ routeTree, defaultPreload: 'intent', parseSearch, stringifySearch });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
