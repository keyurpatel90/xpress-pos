export type EffectivePrice = { targetType: 'item' | 'variant' | 'combo'; targetId: string; name: string; pricePaise: number; reason: string };
export type Variant = { id: string; name: string; pricePaise: number; priceLabel?: string; taxRate: number | null; recipeMultiplier: number; isAvailable: boolean; sort: number };
export type VariantGroup = { id: string; name: string; required: boolean; minSelect: number; maxSelect: number; variants: Variant[] };
export type ComboLine = { menuItemId: string; variantId: string | null; name: string; quantity: number; choiceGroup: string | null };
export type MenuAdminItem = { id: string; name: string; categoryId: string | null; isVeg: boolean; pricePaise: number; isAvailable: boolean; variants: VariantGroup[]; comboMembershipCount: number };
