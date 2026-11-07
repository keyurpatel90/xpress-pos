import { z } from 'zod';

const paise = z.coerce.number().int().min(0);
const optionalPaise = paise.optional();

export const variantSchema = z.object({
  id: z.string().uuid().optional(), name: z.string().trim().min(1).max(80), pricePaise: paise,
  taxRate: z.coerce.number().min(0).max(100).nullable().optional(), recipeMultiplier: z.coerce.number().positive().max(100).default(1),
  hsnSac: z.string().trim().max(30).nullable().optional(), isAvailable: z.boolean().default(true), sort: z.number().int().default(0),
});

export const variantGroupSchema = z.object({
  id: z.string().uuid().optional(), menuItemId: z.string().uuid(), name: z.string().trim().min(1).max(80), required: z.boolean().default(false),
  minSelect: z.number().int().min(0), maxSelect: z.number().int().min(1), sort: z.number().int().default(0),
  variants: z.array(variantSchema).max(50),
}).refine((value) => value.maxSelect >= value.minSelect, { message: 'Maximum selections must be at least the minimum.' });

export const saveMenuItemSchema = z.object({
  id: z.string().uuid().optional(), name: z.string().trim().min(1).max(160), description: z.string().trim().max(2000).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(), isVeg: z.boolean(), hsnSac: z.string().trim().max(30).nullable().optional(),
  taxRate: z.coerce.number().min(0).max(100).nullable().optional(), station: z.string().trim().min(1).max(60), pricePaise: paise,
  unit: z.string().trim().min(1).max(30), usesRestaurantTax: z.boolean().default(true), variants: z.array(variantGroupSchema).max(20).default([]),
});

export const comboItemSchema = z.object({ menuItemId: z.string().uuid(), variantId: z.string().uuid().nullable().optional(), quantity: z.coerce.number().positive(), choiceGroup: z.string().trim().max(80).nullable().optional(), minChoices: z.number().int().min(0).default(0), maxChoices: z.number().int().min(1).default(1), sort: z.number().int().default(0) });
export const comboSchema = z.object({
  id: z.string().uuid().optional(), name: z.string().trim().min(1).max(160), description: z.string().trim().max(2000).nullable().optional(),
  pricingMode: z.enum(['fixed', 'discount_percent', 'discount_flat']), comboPricePaise: paise, discountValue: paise.default(0),
  isAvailable: z.boolean().default(true), validFrom: z.string().datetime().nullable().optional(), validTo: z.string().datetime().nullable().optional(), imagePath: z.string().max(500).nullable().optional(), sort: z.number().int().default(0), items: z.array(comboItemSchema).min(1).max(100),
});

export const scheduleRuleSchema = z.object({ targetType: z.enum(['item', 'category', 'variant', 'combo']), targetId: z.string().uuid(), action: z.enum(['set_price', 'percent_off', 'flat_off', 'buy_x_get_y']), value: paise, buyQty: z.number().int().positive().nullable().optional(), getQty: z.number().int().positive().nullable().optional() });
export const scheduleSchema = z.object({
  id: z.string().uuid().optional(), name: z.string().trim().min(1).max(120), isActive: z.boolean().default(true), daysOfWeek: z.array(z.number().int().min(1).max(7)).min(1),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), timezone: z.string().min(1).max(80), validFrom: z.string().nullable().optional(), validTo: z.string().nullable().optional(), priority: z.number().int().min(0), outletIds: z.array(z.string().uuid()).default([]), rules: z.array(scheduleRuleSchema).min(1),
});

export const availabilitySchema = z.object({ targetType: z.enum(['item', 'variant', 'combo']), targetId: z.string().uuid(), available: z.boolean() });
export const menuFiltersSchema = z.object({ search: z.string().trim().max(100).default(''), categoryId: z.string().uuid().nullable().optional(), page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(25) });

export type SaveMenuItemInput = z.infer<typeof saveMenuItemSchema>;
export type SaveComboInput = z.infer<typeof comboSchema>;
export type SaveScheduleInput = z.infer<typeof scheduleSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type MenuFilters = z.infer<typeof menuFiltersSchema>;
