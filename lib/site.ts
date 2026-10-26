export const BRAND = 'Xpress POS';
export const TAGLINE = 'Cloud POS for restaurants, cafes and food counters';
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '';
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '';

export type FeatureCopy = { key: string; icon: string; title: string; text: string; detail: string[] };

export const FEATURES: FeatureCopy[] = [
  { key: 'pos', icon: 'pos', title: 'Fast counter billing',
    text: 'Tap items, add a discount, take cash, UPI or card and print an 80mm bill.',
    detail: ['Dine-in, takeaway and delivery orders', 'Percent or flat discounts', 'Running bills that stay open until paid', 'Sequential invoice numbers with your own prefix'] },
  { key: 'tables', icon: 'table', title: 'Tables and floor view',
    text: 'See which tables are free or busy and open any table’s running bill in one tap.',
    detail: ['Tell us how many tables you have and we create them', 'Sections such as AC, Garden or Rooftop', 'Live status that updates as orders are sent and paid'] },
  { key: 'kds', icon: 'flame', title: 'KOT and kitchen display',
    text: 'Orders reach the kitchen screen the moment they are sent, split by station.',
    detail: ['Stations such as Kitchen, Tandoor and Bar', 'New, preparing and ready columns with a timer on every ticket', 'Sound alert for new tickets', 'Print a KOT slip when you need paper'] },
  { key: 'menu', icon: 'menu', title: 'Menu, units and GST',
    text: 'Categories, veg or non-veg, sold-by units and GST per item, all under your control.',
    detail: ['Plate, piece, glass, kg and more', 'Default GST with per-item override', 'Inclusive or exclusive tax', 'Mark a dish unavailable when it runs out'] },
  { key: 'modifiers', icon: 'sliders', title: 'Modifiers and add-ons',
    text: 'Spice level, size, extra cheese. Group the options and attach them to the right dishes.',
    detail: ['Option groups with optional prices', 'Prompted at the time of ordering', 'Printed on the kitchen ticket'] },
  { key: 'inventory', icon: 'box', title: 'Inventory and low-stock alerts',
    text: 'Track ingredients, record purchases and wastage, and see what to reorder.',
    detail: ['Stock in kg, litre, piece and more', 'Reorder levels with low-stock warnings', 'Full movement history for every item'] },
  { key: 'recipes', icon: 'book', title: 'Recipe costing',
    text: 'Link ingredients to dishes to see food cost, margin and automatic stock deduction.',
    detail: ['Cost per serving from live ingredient prices', 'Margin and food-cost percentage', 'Stock is deducted when the order is sent to the kitchen'] },
  { key: 'customers', icon: 'users', title: 'Customers and loyalty',
    text: 'Keep a customer book with visit history and reward regulars with points.',
    detail: ['Add a customer from the bill screen', 'Earn points on every bill and redeem them as a discount', 'Visits and total spend per customer'] },
  { key: 'split_billing', icon: 'card', title: 'Split billing',
    text: 'Settle one bill with several payment modes, for example part cash and part UPI.',
    detail: ['Any mix of cash, UPI, card and other', 'Cash received and change calculator', 'Every payment recorded against the bill'] },
  { key: 'whatsapp', icon: 'chat', title: 'WhatsApp bills',
    text: 'Send the bill to the customer on WhatsApp with one click, using your WhatsApp Business number.',
    detail: ['Uses the official WhatsApp Cloud API', 'A private link to a clean, printable bill', 'Delivery log for every message'] },
  { key: 'staff', icon: 'badge', title: 'Staff logins by role',
    text: 'Invite cashiers, waiters, chefs and kitchen screens. Everyone lands on the screen built for their job.',
    detail: ['No role switching: your login decides what you see', 'Invite by email or create a login with a password', 'Disable access instantly'] },
  { key: 'reports', icon: 'chart', title: 'Sales reports',
    text: 'Daily sales, best sellers, payment mode split and order types for any date range.',
    detail: ['Today, 7 days, 30 days or a custom range', 'Download as CSV', 'Tax, discount and service charge totals'] },
];

export const STEPS = [
  { title: 'Create your account', text: 'Sign up with your restaurant name and email, then confirm the link we send you.' },
  { title: 'Set up in minutes', text: 'Add tables, categories and menu items, or load a sample menu and edit it.' },
  { title: 'Invite your team and start billing', text: 'Give each person their own login and take your first order.' },
];

export const ROLE_PANELS = [
  { role: 'Owner', text: 'Sets up the menu, tables and staff. Sees reports, plan and billing.' },
  { role: 'Cashier', text: 'Opens on the POS. Sends orders, applies discounts and collects payment.' },
  { role: 'Waiter', text: 'Opens on the POS. Takes orders at the table and marks dishes served.' },
  { role: 'Chef', text: 'Opens on the kitchen board. Starts and finishes tickets, marks dishes unavailable.' },
  { role: 'Kitchen display', text: 'A shared screen login that only ever shows the kitchen board.' },
];

export const FAQS: { q: string; a: string }[] = [
  { q: 'How does the free trial work?', a: 'Every new restaurant gets a free trial period without entering a card. You can set up everything and take real orders. When the trial ends you choose a plan to continue.' },
  { q: 'Which features need a paid plan?', a: 'Core billing, tables, menu, kitchen display, customers and staff logins are free during the trial. A few advanced features, such as inventory, reports, split billing, WhatsApp bills, loyalty and recipe costing, are tied to paid plans. The pricing page always shows the current list.' },
  { q: 'Do I need special hardware?', a: 'No. Xpress POS runs in a web browser on a phone, tablet or computer. For paper bills, any printer your device can print to works, including 80mm thermal printers.' },
  { q: 'Does it work without internet?', a: 'No. Xpress POS is a cloud system and needs an internet connection. Keep a mobile hotspot as a backup for peak hours.' },
  { q: 'Can my staff have their own logins?', a: 'Yes. Invite cashiers, waiters, chefs and kitchen screens. Each login opens straight to the right screen and only shows what that role needs.' },
  { q: 'How do WhatsApp bills work?', a: 'Connect your WhatsApp Business Cloud API details once in Settings. After that, press Send on WhatsApp on any bill and the customer receives a link to their bill.' },
  { q: 'Is GST supported?', a: 'You can set a default GST rate, override it per item, and choose whether prices include tax. Bills show the tax split, and your GSTIN is printed on the invoice.' },
  { q: 'Can I run more than one restaurant?', a: 'Each restaurant has its own account, menu, staff and billing. Sign up again with a different email for another outlet.' },
  { q: 'How do I pay for a plan?', a: 'Pay online through Razorpay with UPI, cards or net banking. You can renew or upgrade at any time from Plan and billing.' },
  { q: 'What happens if my plan ends?', a: 'Your data stays safe. Depending on the platform setting, the app either asks you to renew before continuing or keeps the free features available.' },
];

export type PlanLite = {
  id: string; name: string; description: string | null; level: number;
  price_monthly: number; price_yearly: number | null; highlights: string[]; is_popular: boolean;
};

/** Used only if the database is unreachable (matches the seed data in schema.sql). */
export const FALLBACK_PLANS: PlanLite[] = [
  { id: 'starter', name: 'Starter', description: 'For a single counter or small cafe', level: 1, price_monthly: 300, price_yearly: 3000, is_popular: false,
    highlights: ['Everything in the free plan', 'Inventory and low-stock alerts', 'Sales reports', 'Split billing and multiple payment modes'] },
  { id: 'professional', name: 'Professional', description: 'For busy restaurants', level: 2, price_monthly: 799, price_yearly: 7990, is_popular: true,
    highlights: ['Everything in Starter', 'WhatsApp bills', 'Customer loyalty points'] },
  { id: 'enterprise', name: 'Enterprise', description: 'For multi-station kitchens', level: 3, price_monthly: 1199, price_yearly: 11990, is_popular: false,
    highlights: ['Everything in Professional', 'Recipe costing and auto stock deduction', 'Priority support'] },
];

export const LEGAL: Record<string, { title: string; body: string[] }> = {
  terms: { title: 'Terms of service', body: [
    'These terms are a starting template. Have them reviewed by a lawyer before you go live.',
    'Xpress POS is provided as a subscription service. You are responsible for the accuracy of the menu, prices, taxes and bills you create.',
    'You must keep your login details safe and are responsible for activity under your account and the staff logins you create.',
    'We may suspend accounts that misuse the service or fail to pay for a paid plan.',
  ] },
  privacy: { title: 'Privacy policy', body: [
    'This policy is a starting template. Have it reviewed by a lawyer before you go live.',
    'We store the account details you give us, your restaurant data (menu, orders, customers, staff) and basic usage logs, only to run the service.',
    'Your restaurant data is visible only to the logins of your restaurant and to the platform administrators for support.',
    'Payments are processed by Razorpay. We do not store card details.',
    'Bills sent on WhatsApp are delivered through the WhatsApp Business Cloud API using your own credentials.',
  ] },
  refunds: { title: 'Refund and cancellation policy', body: [
    'This policy is a starting template. Edit it to match your business before you go live.',
    'The free trial needs no payment. Paid plans are prepaid for the period you choose and are not automatically renewed.',
    'If you were charged in error or have a billing problem, contact support with your payment reference and we will review it.',
  ] },
};
