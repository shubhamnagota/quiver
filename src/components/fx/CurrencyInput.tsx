import { useId } from 'react';
import { COMMON_CURRENCIES, currencyName } from '@/lib/fx/currencies';
import { useFx } from '@/lib/fx/store';
import { cn } from '@/lib/utils';

/** A currency code field with search by code or name. */
export function CurrencyInput({
  value,
  onChange,
  label,
  className,
}: {
  value: string;
  onChange: (code: string) => void;
  label: string;
  className?: string;
}) {
  const id = useId();
  const rates = useFx((s) => s.snapshot?.rates);
  const codes = rates ? Object.keys(rates).sort() : COMMON_CURRENCIES;
  return (
    <>
      <input
        aria-label={label}
        list={id}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 3))}
        onFocus={(e) => e.target.select()}
        maxLength={3}
        spellCheck={false}
        title={currencyName(value)}
        className={cn('w-20 rounded-md border border-border bg-transparent px-2 py-1.5 font-mono text-sm uppercase', className)}
      />
      <datalist id={id}>
        {codes.map((c) => <option key={c} value={c}>{currencyName(c)}</option>)}
      </datalist>
    </>
  );
}
