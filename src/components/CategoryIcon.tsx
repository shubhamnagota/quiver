import { Code, CreditCard, NotebookPen, Wallet, type LucideProps } from 'lucide-react';
import type { Category } from '@/tools/types';

const icons = { dev: Code, payments: CreditCard, life: Wallet, productivity: NotebookPen };

export function CategoryIcon({ category, ...props }: { category: Category } & LucideProps) {
  const Icon = icons[category];
  return <Icon {...props} />;
}
