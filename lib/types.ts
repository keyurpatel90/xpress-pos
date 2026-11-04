// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export type Role = 'owner' | 'cashier' | 'waiter' | 'chef' | 'kds';

export type Access = {
  restaurant_id: string | null;
  role: Role | null;
  is_super_admin: boolean;
  status: 'trialing' | 'active' | 'expired' | null;
  locked: boolean;
  trial_ends_at: string | null;
  period_end: string | null;
  plan_id: string | null;
  plan_name: string | null;
  plan_level: number | null;
  days_left: number;
  features: Record<string, boolean>;
};
