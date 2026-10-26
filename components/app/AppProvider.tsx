'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import type { Access, Role, Row } from '@/lib/types';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';
type ToastFn = (message: string, type?: ToastType) => void;
type Ctx = {
  access: Access;
  profile: Row;
  restaurant: Row;
  role: Role;
  email: string;
  has: (feature: string) => boolean;
  refresh: () => Promise<void>;
  print: (node: ReactNode) => void;
};

const AppCtx = createContext<Ctx | null>(null);
const ToastCtx = createContext<ToastFn>(() => {});

export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp must be used inside AppProvider');
  return c;
};
export const useToast = () => useContext(ToastCtx);

export function AppProvider({ initial, children }: {
  initial: { access: Access; profile: Row; restaurant: Row; email: string };
  children: ReactNode;
}) {
  const [access, setAccess] = useState<Access>(initial.access);
  const [restaurant, setRestaurant] = useState<Row>(initial.restaurant);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([]);
  const [printNode, setPrintNode] = useState<ReactNode>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toast = useCallback<ToastFn>((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'error' ? 6000 : 3500);
  }, []);

  const refresh = useCallback(async () => {
    const sb = createClient();
    const [a, r] = await Promise.all([
      sb.rpc('get_access'),
      sb.from('restaurants').select('*').eq('id', initial.access.restaurant_id as string).maybeSingle(),
    ]);
    if (a.data) setAccess(a.data as Access);
    if (r.data) setRestaurant(r.data as Row);
  }, [initial.access.restaurant_id]);

  const print = useCallback((node: ReactNode) => {
    setPrintNode(node);
    setTimeout(() => {
      document.body.classList.add('printing');
      window.print();
    }, 200);
  }, []);

  useEffect(() => {
    const done = () => { document.body.classList.remove('printing'); setPrintNode(null); };
    window.addEventListener('afterprint', done);
    return () => window.removeEventListener('afterprint', done);
  }, []);

  const value = useMemo<Ctx>(() => ({
    access, restaurant, profile: initial.profile, role: access.role as Role, email: initial.email,
    has: (f) => access.features?.[f] !== false,
    refresh, print,
  }), [access, restaurant, initial.profile, initial.email, refresh, print]);

  return (
    <ToastCtx.Provider value={toast}>
      <AppCtx.Provider value={value}>
        {children}
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
          {toasts.map((t) => (
            <div key={t.id} role="status" className={cn(
              'pointer-events-auto max-w-md rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lift',
              t.type === 'error' ? 'bg-chili-600' : t.type === 'success' ? 'bg-pine-700' : 'bg-ink')}>
              {t.message}
            </div>
          ))}
        </div>
        {mounted && printNode ? createPortal(<div id="print-root">{printNode}</div>, document.body) : null}
      </AppCtx.Provider>
    </ToastCtx.Provider>
  );
}
