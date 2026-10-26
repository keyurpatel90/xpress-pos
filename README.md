# Xpress POS

Multi-restaurant cloud POS built with **Next.js 14 (App Router) + Supabase + Razorpay + WhatsApp Cloud API**, ready for Vercel.

- Public site: home, features, pricing, FAQ, support form, legal pages (brand: "Xpress POS")
- Restaurant owners sign up, **verify their email, then log in**. Every restaurant is an isolated tenant with a free trial (30 days by default)
- POS, tables, KOT + kitchen display, menu + modifiers, inventory, recipe costing, customers + loyalty, split billing, reports, WhatsApp bills
- Owner invites **cashier / waiter / chef / KDS** users. The role comes from the login, there is no role dropdown
- Razorpay subscriptions. A **super admin** panel decides which features need a subscription, edits plans and prices, and manages restaurants
- No customer QR ordering (by design)

## 1. Supabase

1. Create a project at supabase.com (pick a region close to your users, e.g. Mumbai).
2. **SQL Editor > New query**, paste the whole of `supabase/schema.sql`, run it. It is safe to run again.
3. **Authentication > Providers > Email**: keep **Confirm email = ON** (this is what makes "verify, then log in" work).
4. **Authentication > URL Configuration**: set *Site URL* to your deployed URL and add `https://YOUR-APP.vercel.app/**` and `http://localhost:3000/**` under *Redirect URLs*.
5. **Authentication > Emails > Templates** (recommended, makes links work on any device):
   - Confirm signup: `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>`
   - Invite user: `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/auth/set-password">Accept invitation</a>`
   - Reset password: `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/set-password">Reset password</a>`

   The default templates also work (the app handles both link styles).
6. **Authentication > SMTP**: configure your own SMTP provider before going live. Supabase's built-in mailer is limited to a few emails per hour.
7. Copy *Project URL*, *anon key* and *service_role key* from **Project Settings > API**.

## 2. Deploy on Vercel

1. Push this folder to GitHub and import it in Vercel (framework: Next.js, no settings to change).
2. Add the environment variables from `.env.example` (Supabase, `NEXT_PUBLIC_SITE_URL`, Razorpay; WhatsApp and support contact are optional).
3. Deploy. Local run: `cp .env.example .env.local`, fill it in, `npm install`, `npm run dev`.

## 3. Become super admin

Sign up in the app with your own email and verify it, then run this once in the SQL Editor:

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'you@example.com'
on conflict do nothing;
```

Open `/admin` (also linked from the sidebar). There you can:

| Page | What it does |
| --- | --- |
| Restaurants | Status of every restaurant; extend a trial, grant a plan without payment, suspend or restore |
| Plans | Create/edit plans, monthly and yearly prices, highlights, level |
| Feature access | Per feature: **free or needs a subscription**, and the lowest plan level that unlocks it. Applies instantly |
| Platform settings | Trial length, whether trial restaurants get paid features, and what happens when a trial/plan ends (lock the app, or keep free features) |
| Support inbox | Messages from the public Support form |

Defaults: free = POS, tables, menu, kitchen display, customers, staff logins, modifiers. Paid = inventory, reports, split billing (Starter), WhatsApp bills, loyalty (Professional), recipe costing (Enterprise). Plan prices are placeholders; change them in the admin panel.

Feature gating is enforced in the **database** (row level security and the order functions), not just hidden in the UI.

## 4. Razorpay

1. Put your key id/secret in the env vars (use `rzp_test_...` keys first).
2. **Dashboard > Webhooks**: URL `https://YOUR-APP.vercel.app/api/billing/webhook`, secret = `RAZORPAY_WEBHOOK_SECRET`, events `payment.captured` and `order.paid`.
3. Flow: owner picks a plan on *Plan and billing* -> server creates a Razorpay order -> checkout -> server verifies the signature, confirms with Razorpay that the payment is captured (it captures authorized payments itself) -> `apply_payment()` activates the plan. The webhook does the same if the browser closes early. Activation is idempotent, so it can never double-extend.
4. Plans are **prepaid periods** (monthly or yearly) that the owner renews manually, not auto-debit mandates. Renewing the same plan extends from the current end date; changing plan carries the remaining value over.

## 5. WhatsApp bills

Each restaurant saves its own **WhatsApp Business Cloud API** details in *Settings* (phone number ID, permanent token, optional template). You can also set platform-wide defaults with the `WHATSAPP_*` env vars.

- The *Send on WhatsApp* button (after payment, and on the Orders screen) calls the Cloud API and sends a private link to a printable bill (`/b/<token>`).
- WhatsApp only delivers free-form text to customers who messaged you in the last 24 hours. For everyone else, create and get approved a template with 5 body variables: `{{1}}` customer name, `{{2}}` restaurant, `{{3}}` bill number, `{{4}}` amount, `{{5}}` bill link, and enter its name in Settings.
- If the API is not connected, the button opens WhatsApp with the message pre-filled so staff can still send it manually.

## 6. How roles work

| Login | Lands on | Can do |
| --- | --- | --- |
| Owner | Dashboard | Everything for their restaurant |
| Cashier | POS | Orders, discounts, payment, cancel items/orders, customers |
| Waiter | POS | Orders, send to kitchen, mark served, customers |
| Chef | Kitchen board | Move tickets, mark dishes unavailable |
| KDS | Kitchen board | Move tickets only |

Owners add staff under *Staff*: either an email invitation (the person sets their own password) or a login with a password you choose. Disabled staff cannot sign in.

## 7. What was verified

- `next build` (type-check and production build) passes with no errors, 36 routes.
- `supabase/schema.sql` was run twice on PostgreSQL 16 with Supabase-style roles, and a scripted test covered: trigger-created restaurants, tenant isolation, role permissions, KOT/billing maths with GST and discounts, one open order per table, split payments, recipe stock deduction, feature gating in trial / active / expired states, and idempotent payment activation.
- The running production server was smoke-tested for page responses, auth redirects and API error handling.

Not tested here (needs your keys and a browser): the live Supabase email flow, a real Razorpay payment, a real WhatsApp send, and on-device printing. Run one end-to-end pass of each in test mode before going live.

## Known limits

- Internet connection required (no offline mode).
- Bills print through the browser print dialog (works with 80mm thermal printers set as the system printer).
- No table transfer/merge, per-item discounts or multi-outlet switching under one login (sign up separately per outlet).
- `schema.sql` creates sample plans, and the legal pages are templates: review both before launch.
