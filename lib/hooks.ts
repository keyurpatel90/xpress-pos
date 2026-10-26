'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/app/AppProvider';

export function useSupabase() {
  return useMemo(() => createClient(), []);
}

export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** Load data with the browser client; errors become toasts. */
export function useData<T>(loader: (sb: SupabaseClient) => PromiseLike<T>, initial: T, deps: unknown[] = []) {
  const sb = useSupabase();
  const toast = useToast();
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const reload = useCallback(async () => {
    try {
      setData(await loaderRef.current(sb));
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [sb, toast]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [reload, ...deps]);
  return { data, loading, reload, setData };
}

function friendly(m: string) {
  if (/orders_one_open_per_table/.test(m)) return 'This table already has an open order. Select the table again to open it.';
  if (/duplicate key/i.test(m)) return 'That already exists. Use a different name or number.';
  if (/row-level security/i.test(m)) return 'You do not have permission to do that, or this feature is not part of your plan.';
  return m;
}

/** Run an async action; shows the error (or an optional success message) as a toast. */
export function useAction() {
  const toast = useToast();
  return useCallback(
    async <T,>(fn: () => PromiseLike<T>, ok?: string): Promise<T | undefined> => {
      try {
        const r = await fn();
        if (ok) toast(ok, 'success');
        return r;
      } catch (e) {
        toast(friendly((e as Error).message || 'Something went wrong'), 'error');
        return undefined;
      }
    },
    [toast]
  );
}

export async function api<T = Record<string, unknown>>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error || `Request failed (${res.status})`);
  return json as T;
}
