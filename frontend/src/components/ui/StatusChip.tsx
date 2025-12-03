import { cn } from '../../utils/helpers';
import { OrderStatus, ORDER_STATUS_LABELS } from '../../types';
import { Circle, Clock, Package, CheckCircle, XCircle } from 'lucide-react';

interface StatusChipProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const statusConfig: Record<OrderStatus, {
  class: string;
  icon: typeof Circle;
}> = {
  planned: {
    class: 'chip-planned',
    icon: Circle,
  },
  in_progress: {
    class: 'chip-in-progress',
    icon: Clock,
  },
  waiting_for_parts: {
    class: 'chip-waiting',
    icon: Package,
  },
  completed: {
    class: 'chip-completed',
    icon: CheckCircle,
  },
  cancelled: {
    class: 'chip-cancelled',
    icon: XCircle,
  },
};

export function StatusChip({ status, size = 'md', showIcon = true }: StatusChipProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'chip',
        config.class,
        size === 'sm' && 'text-xs px-2 py-0.5'
      )}
    >
      {showIcon && <Icon className={cn('w-3.5 h-3.5', size === 'sm' && 'w-3 h-3')} />}
      <span>{ORDER_STATUS_LABELS[status]}</span>
    </span>
  );
}
