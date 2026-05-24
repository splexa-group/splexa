export interface RouteAction {
  label: string;
  href: string;
}

export interface RouteConfig {
  title: string;
  action?: RouteAction;
}

export const ROUTE_CONFIG: Record<string, RouteConfig> = {
  '/dashboard': { title: 'Dashboard', action: { label: 'New Case',    href: '/cases/new'    } },
  '/cases':     { title: 'Cases',     action: { label: 'New Case',    href: '/cases/new'    } },
  '/clients':   { title: 'Clients',   action: { label: 'New Client',  href: '/clients/new'  } },
  '/calendar':  { title: 'Calendar',  action: { label: 'Add Hearing', href: '/calendar/new' } },
  '/documents': { title: 'Documents' },
  '/settings':  { title: 'Settings'  },
};
