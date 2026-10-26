'use client';
import { Icon } from '@/components/Icon';

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-secondary btn-md no-print">
      <Icon name="print" className="h-4 w-4" /> Print or save as PDF
    </button>
  );
}
