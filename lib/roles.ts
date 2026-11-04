import type { Role } from './types';

export const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner', cashier: 'Cashier', waiter: 'Waiter', chef: 'Chef', kds: 'Kitchen display',
};
export const ROLE_HELP: Record<Role, string> = {
  owner: 'Full access to setup, reports and billing',
  cashier: 'Takes orders, bills and collects payment',
  waiter: 'Takes orders at the table and marks food served',
  chef: 'Works the kitchen queue and marks dishes unavailable',
  kds: 'Shared kitchen screen login',
};
export const STAFF_ROLES: Role[] = ['cashier', 'waiter', 'chef', 'kds'];

export function landingFor(role: Role | null, isSuper: boolean) {
  if (!role) return isSuper ? '/admin' : '/app';
  if (role === 'cashier' || role === 'waiter') return '/app/pos';
  if (role === 'chef' || role === 'kds') return '/app/kds';
  return '/app';
}

export type NavItem = { href: string; label: string; icon: string; roles: Role[]; feature?: string };
export const NAV: NavItem[] = [
  { href: '/app', label: 'Dashboard', icon: 'home', roles: ['owner'] },
  { href: '/app/pos', label: 'POS', icon: 'pos', roles: ['owner', 'cashier', 'waiter'] },
  { href: '/app/tables', label: 'Tables', icon: 'table', roles: ['owner', 'cashier', 'waiter'], feature: 'tables' },
  { href: '/app/orders', label: 'Orders', icon: 'receipt', roles: ['owner', 'cashier', 'waiter'] },
  { href: '/app/kds', label: 'Kitchen', icon: 'flame', roles: ['owner', 'cashier', 'chef', 'kds'], feature: 'kds' },
  { href: '/app/menu', label: 'Menu', icon: 'menu', roles: ['owner', 'chef'], feature: 'menu' },
  { href: '/app/modifiers', label: 'Modifiers', icon: 'sliders', roles: ['owner'], feature: 'modifiers' },
  { href: '/app/inventory', label: 'Inventory', icon: 'box', roles: ['owner'], feature: 'inventory' },
  { href: '/app/recipes', label: 'Recipes', icon: 'book', roles: ['owner'], feature: 'recipes' },
  { href: '/app/customers', label: 'Customers', icon: 'users', roles: ['owner', 'cashier', 'waiter'], feature: 'customers' },
  { href: '/app/staff', label: 'Staff', icon: 'badge', roles: ['owner'], feature: 'staff' },
  { href: '/app/reports', label: 'Reports', icon: 'chart', roles: ['owner'], feature: 'reports' },
  { href: '/app/billing', label: 'Plan & billing', icon: 'card', roles: ['owner'] },
  { href: '/app/settings', label: 'Settings', icon: 'gear', roles: ['owner'] },
];

export function navFor(pathname: string) {
  return NAV.filter((n) => (n.href === '/app' ? pathname === '/app' : pathname === n.href || pathname.startsWith(n.href + '/')))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
