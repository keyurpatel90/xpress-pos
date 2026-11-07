# Advanced menu module

## Added

- `supabase/advanced_menu.sql`: idempotent advanced menu tables, outlet-scoped RLS, availability RPCs, and effective-price RPC.
- `lib/menu/schemas.ts`: shared zod validation for menu items, variants, combos, schedules, availability, and filters.
- `app/app/menu/actions.ts`: server actions with authenticated outlet and owner/chef authorization checks.
- `app/api/menu/effective-prices/route.ts`: authenticated effective-price route.
- `components/menu/VariantPicker.tsx`, `ComboPicker.tsx`, and `PriceBadge.tsx`: reusable POS display components that consume server-provided prices.

## Verified

- TypeScript production build passes with `npm run build`.
- API input is validated with zod before server access.
- Server actions verify the signed-in user, active outlet, and role before writes.
- Effective prices are sourced from the database RPC rather than calculated in React.

## Requires a real database

Apply `supabase/advanced_menu.sql` to the connected Supabase project before using the advanced menu server actions. The existing application menu screen still contains legacy direct menu editing paths; migrating those paths to the new RPC-only actions and adding the full manager/editor/schedule screens should be completed before treating this module as production-ready.
