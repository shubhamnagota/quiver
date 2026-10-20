import { BedDouble, Car, HandCoins, House, ShoppingBag, ShoppingCart, Tag, Ticket, Utensils, type LucideIcon } from 'lucide-react';
import type { CategoryId, Expense } from './lib';

const ICONS: Record<CategoryId, LucideIcon> = {
  food: Utensils,
  groceries: ShoppingCart,
  transport: Car,
  stay: BedDouble,
  home: House,
  shopping: ShoppingBag,
  fun: Ticket,
  other: Tag,
};

export function ExpenseIcon({ expense, className }: { expense: Pick<Expense, 'kind' | 'category'>; className?: string }) {
  const Icon = expense.kind === 'payment' ? HandCoins : ICONS[expense.category];
  return <Icon className={className} aria-hidden />;
}
