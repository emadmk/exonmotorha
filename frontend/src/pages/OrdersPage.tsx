import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  ChevronLeft,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusChip } from '../components/ui/StatusChip';
import { BottomNav } from '../components/layout/BottomNav';
import { orderAPI } from '../services/api';
import { Order, OrderStatus } from '../types';
import { cn, formatDateSmart, toPersianDigits } from '../utils/helpers';

const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'planned', label: 'برنامه‌ریزی شده' },
  { value: 'in_progress', label: 'در حال انجام' },
  { value: 'waiting_for_parts', label: 'انتظار قطعه' },
  { value: 'completed', label: 'تکمیل شده' },
  { value: 'cancelled', label: 'لغو شده' },
];

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await orderAPI.getMyOrders(params);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleInfo = (order: Order) => {
    const vehicle = order.vehicleId as any;
    if (typeof vehicle === 'object') {
      return `${vehicle.brand} ${vehicle.model}`;
    }
    return '-';
  };

  return (
    <div className="min-h-screen bg-dark-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
          <Link to="/dashboard" className="p-2 -mr-2 text-dark-400 hover:text-white">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center font-semibold text-white">سفارش‌های من</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                statusFilter === filter.value
                  ? 'bg-gold-600 text-dark-950'
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : orders.length === 0 ? (
          <GlassCard padding="lg" className="text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-dark-600" />
            <p className="text-dark-400 mb-4">سفارشی یافت نشد</p>
            <Link to="/request" className="btn-primary inline-block">
              ثبت سفارش جدید
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order._id} to={`/orders/${order._id}`}>
                <GlassCard hoverable padding="md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-dark-800 rounded-xl flex items-center justify-center">
                        <Car className="w-6 h-6 text-gold-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{order.orderNumber}</span>
                          <StatusChip status={order.status} size="sm" />
                        </div>
                        <p className="text-sm text-dark-400">
                          {getVehicleInfo(order)} • {order.issues.slice(0, 2).join('، ')}
                        </p>
                        <p className="text-xs text-dark-500 mt-1">
                          {formatDateSmart(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-dark-500" />
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 pt-3 border-t border-dark-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-dark-400">پیشرفت</span>
                      <span className="text-xs text-gold-500">{toPersianDigits(order.progressPercentage)}٪</span>
                    </div>
                    <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-gold rounded-full transition-all"
                        style={{ width: `${order.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
