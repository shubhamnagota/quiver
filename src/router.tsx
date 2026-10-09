import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { AppShell } from './components/AppShell';
import { About } from './pages/About';
import { CategoryPage } from './pages/CategoryPage';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { Saved } from './pages/Saved';
import { Settings } from './pages/Settings';
import { ToolPage } from './pages/ToolPage';

const rootRoute = createRootRoute({ component: AppShell, notFoundComponent: NotFound });

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home });

const toolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/t/$toolId',
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

const savedRoute = createRoute({ getParentRoute: () => rootRoute, path: '/saved', component: Saved });
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: Settings });
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: About });

const routeTree = rootRoute.addChildren([
  homeRoute,
  toolRoute,
  categoryRoute,
  savedRoute,
  settingsRoute,
  aboutRoute,
]);

export const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
