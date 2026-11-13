export const ORDER_ITEM_STATUSES = ['new', 'preparing', 'ready', 'served', 'cancelled'] as const;
export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number];
export type KitchenStage = Exclude<OrderItemStatus, 'served' | 'cancelled'>;

export function isOrderItemStatus(value: unknown): value is OrderItemStatus {
  return typeof value === 'string' && ORDER_ITEM_STATUSES.includes(value as OrderItemStatus);
}

const orderItemTransitions: Readonly<Record<OrderItemStatus, readonly OrderItemStatus[]>> = {
  new: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: [],
  cancelled: [],
};

export function canTransitionOrderItem(from: OrderItemStatus, to: OrderItemStatus) {
  return orderItemTransitions[from].includes(to);
}

export function nextOrderItemStatus(from: OrderItemStatus): OrderItemStatus | null {
  return orderItemTransitions[from].find((status) => status !== 'cancelled') ?? null;
}

export function nextKitchenStage(statuses: readonly OrderItemStatus[]): KitchenStage | null {
  if (statuses.includes('new')) return 'new';
  if (statuses.includes('preparing')) return 'preparing';
  if (statuses.includes('ready')) return 'ready';
  return null;
}

export type OrderStatus = 'open' | 'paid' | 'cancelled';

const orderTransitions: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  open: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus) {
  return orderTransitions[from].includes(to);
}

export type StoredSubscriptionStatus = 'trialing' | 'active' | 'expired' | 'cancelled';
export type EffectiveSubscriptionStatus = 'trialing' | 'active' | 'expired';

export function effectiveSubscriptionStatus(input: {
  storedStatus: StoredSubscriptionStatus;
  trialEndsAt: string | Date | null | undefined;
  currentPeriodEnd: string | Date | null | undefined;
  now?: number;
}): EffectiveSubscriptionStatus {
  const now = input.now ?? Date.now();
  const periodEnd = input.currentPeriodEnd ? new Date(input.currentPeriodEnd).getTime() : Number.NaN;
  const trialEnd = input.trialEndsAt ? new Date(input.trialEndsAt).getTime() : Number.NaN;

  if (input.storedStatus === 'active' && Number.isFinite(periodEnd) && periodEnd > now) return 'active';
  if (input.storedStatus !== 'cancelled' && Number.isFinite(trialEnd) && trialEnd > now) return 'trialing';
  return 'expired';
}

export type StoredTableStatus = 'free' | 'occupied' | 'reserved';
export type EffectiveTableStatus = 'free' | 'occupied' | 'reserved';

export function effectiveTableStatus(status: StoredTableStatus, hasOpenOrder: boolean): EffectiveTableStatus {
  if (hasOpenOrder) return 'occupied';
  return status === 'reserved' ? 'reserved' : 'free';
}

export type ProfileStatus = 'invited' | 'active' | 'disabled';

const profileTransitions: Readonly<Record<ProfileStatus, readonly ProfileStatus[]>> = {
  invited: ['active', 'disabled'],
  active: ['disabled'],
  disabled: ['active'],
};

export function canTransitionProfile(from: ProfileStatus, to: ProfileStatus) {
  return from === to || profileTransitions[from].includes(to);
}

export type SupportTicketStatus = 'open' | 'closed';

const supportTicketTransitions: Readonly<Record<SupportTicketStatus, readonly SupportTicketStatus[]>> = {
  open: ['closed'],
  closed: ['open'],
};

export function canTransitionSupportTicket(from: SupportTicketStatus, to: SupportTicketStatus) {
  return from === to || supportTicketTransitions[from].includes(to);
}
