export type GstOrderType = 'dine_in' | 'takeaway' | 'delivery';

export type GstLineInput = {
  unitPrice: number;
  quantity: number;
  taxRate: number;
  discount?: number;
};

export type GstLine = {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  gross: number;
  taxRate: number;
};

export type GstTotals = {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  gross: number;
  lines: GstLine[];
};

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateGst(lines: GstLineInput[], orderType: GstOrderType, billDiscount = 0): GstTotals {
  const base = lines.map((line) => Math.max(0, line.unitPrice * line.quantity - (line.discount ?? 0)));
  const totalBase = base.reduce((sum, value) => sum + value, 0);
  const discount = Math.min(Math.max(0, billDiscount), totalBase);

  const calculated = lines.map((line, index) => {
    const taxableValue = round(base[index] - (totalBase ? discount * base[index] / totalBase : 0));
    const rate = Math.max(0, line.taxRate) / 100;
    const tax = round(taxableValue * rate);
    const isIgst = orderType === 'delivery';
    const cgst = isIgst ? 0 : round(tax / 2);
    const sgst = isIgst ? 0 : round(tax - cgst);
    const igst = isIgst ? tax : 0;
    return { taxableValue, cgst, sgst, igst, tax, gross: round(taxableValue + tax), taxRate: line.taxRate };
  });

  return calculated.reduce<GstTotals>((totals, line) => ({
    taxableValue: round(totals.taxableValue + line.taxableValue),
    cgst: round(totals.cgst + line.cgst),
    sgst: round(totals.sgst + line.sgst),
    igst: round(totals.igst + line.igst),
    tax: round(totals.tax + line.tax),
    gross: round(totals.gross + line.gross),
    lines: [...totals.lines, line],
  }), { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, tax: 0, gross: 0, lines: [] });
}
