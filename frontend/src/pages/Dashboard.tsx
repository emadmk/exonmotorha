import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Car,
  Clock,
  MessageCircle,
  ChevronLeft,
  Bell,
  User,
  CheckCircle,
  Circle,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusChip } from '../components/ui/StatusChip';
import { Button } from '../components/ui/Button';
import { BottomNav } from '../components/layout/BottomNav';
import { useAuthStore } from '../stores/authStore';
import { orderAPI, notificationAPI, messageAPI } from '../services/api';
import { Order, TimelineStep } from '../types';
import {
  formatDateSmart,
  formatNumber,
  formatCurrency,
  toPersianDigits,
  cn,
} from '../utils/helpers';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [orderRes, notifRes] = await Promise.all([
        orderAPI.getCurrent(),
        notificationAPI.getUnreadCount(),
      ]);
      setCurrentOrder(orderRes.data.order);
      setUnreadCount(notifRes.data.count);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleInfo = (order: Order) => {
    const vehicle = order.vehicleId as any;
    if (vehicle && typeof vehicle === 'object' && vehicle.brand) {
      return `${vehicle.brand} ${vehicle.model || ''} ${vehicle.year ? toPersianDigits(vehicle.year) : ''}`.trim();
    }
    return 'خودرو';
  };

  const getTechnicianInfo = (order: Order) => {
    const tech = order.technicianId as any;
    if (tech && typeof tech === 'object') {
      return tech.name || 'تکنسین';
    }
    return null;
  };

  const handleStartChat = async () => {
    if (!currentOrder || isStartingChat) return;

    setIsStartingChat(true);
    try {
      const response = await messageAPI.startOrderChat(currentOrder._id);
      navigate('/messages', { state: { conversationId: response.data.conversation._id } });
    } catch (error: any) {
      console.error('Error starting chat:', error);
      if (error.response?.status === 400) {
        alert('هنوز تکنسینی به این سفارش اختصاص نیافته');
      }
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-gold rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-dark-950" />
            </div>
            <div>
              <p className="text-sm text-dark-400">سلام،</p>
              <p className="font-semibold text-white">{user?.name}</p>
            </div>
          </div>

          <Link to="/notifications" className="relative p-2">
            <Bell className="w-6 h-6 text-dark-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 badge badge-red">
                {toPersianDigits(unreadCount)}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : currentOrder ? (
          <>
            {/* Current Order Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard padding="none">
                {/* Order Header */}
                <div className="p-5 border-b border-dark-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-dark-400 text-sm">
                      سفارش {currentOrder.orderNumber}
                    </span>
                    <StatusChip status={currentOrder.status} size="sm" />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-dark-800 rounded-xl flex items-center justify-center">
                      <Car className="w-6 h-6 text-gold-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {getVehicleInfo(currentOrder)}
                      </p>
                      <p className="text-sm text-dark-400">
                        {currentOrder.issues.join('، ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="p-5 border-b border-dark-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-dark-400 text-sm">پیشرفت</span>
                    <span className="text-gold-500 font-medium">
                      {toPersianDigits(currentOrder.progressPercentage)}٪
                    </span>
                  </div>
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-gold rounded-full transition-all duration-500"
                      style={{ width: `${currentOrder.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Timeline Preview */}
                <div className="p-5">
                  <div className="space-y-4">
                    {currentOrder.timeline.slice(0, 4).map((step, index) => (
                      <div key={step._id} className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                            step.status === 'completed' && 'bg-emerald-500',
                            step.status === 'current' && 'bg-gold-500',
                            step.status === 'upcoming' && 'bg-dark-700'
                          )}
                        >
                          {step.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : step.status === 'current' ? (
                            <Clock className="w-4 h-4 text-dark-950" />
                          ) : (
                            <Circle className="w-3 h-3 text-dark-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'font-medium',
                              step.status === 'upcoming'
                                ? 'text-dark-500'
                                : 'text-white'
                            )}
                          >
                            {step.title}
                          </p>
                          <p className="text-sm text-dark-400 truncate">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    to={`/orders/${currentOrder._id}`}
                    className="mt-4 flex items-center justify-center gap-2 text-gold-500 text-sm font-medium"
                  >
                    <span>مشاهده جزئیات</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>

                {/* Technician Info */}
                {getTechnicianInfo(currentOrder) && (
                  <div className="px-5 pb-5">
                    <GlassCard padding="sm" className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gold-600/20 rounded-full flex items-center justify-center">
                          <span className="text-xl">🔧</span>
                        </div>
                        <div>
                          <p className="text-sm text-dark-400">تکنسین شما</p>
                          <p className="font-medium text-white">
                            {getTechnicianInfo(currentOrder)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleStartChat}
                        disabled={isStartingChat}
                        className="p-2 bg-dark-800 rounded-xl hover:bg-dark-700 transition-colors disabled:opacity-50"
                      >
                        {isStartingChat ? (
                          <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <MessageCircle className="w-5 h-5 text-gold-500" />
                        )}
                      </button>
                    </GlassCard>
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Cost Estimate */}
            {(currentOrder.estimatedCostMin || currentOrder.finalCost) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GlassCard padding="md">
                  <div className="flex items-center justify-between">
                    <span className="text-dark-400">
                      {currentOrder.finalCost ? 'هزینه نهایی' : 'هزینه تخمینی'}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {currentOrder.finalCost
                        ? formatCurrency(currentOrder.finalCost)
                        : `${formatCurrency(currentOrder.estimatedCostMin || 0)} - ${formatCurrency(currentOrder.estimatedCostMax || 0)}`}
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </>
        ) : (
          /* No Active Order */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard padding="lg" className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-dark-800 rounded-full flex items-center justify-center">
                <Car className="w-10 h-10 text-dark-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                سفارش فعالی ندارید
              </h2>
              <p className="text-dark-400 mb-6">
                برای درخواست خدمات، یک سفارش جدید ثبت کنید
              </p>
              <Button onClick={() => navigate('/request')}>
                <Plus className="w-5 h-5 ml-2" />
                ثبت سفارش جدید
              </Button>
            </GlassCard>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">دسترسی سریع</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/request">
              <GlassCard
                hoverable
                padding="md"
                className="flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 bg-gold-600/20 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gold-500" />
                </div>
                <span className="text-sm font-medium text-white">
                  درخواست جدید
                </span>
              </GlassCard>
            </Link>

            <Link to="/orders">
              <GlassCard
                hoverable
                padding="md"
                className="flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary-400" />
                </div>
                <span className="text-sm font-medium text-white">
                  سفارش‌های من
                </span>
              </GlassCard>
            </Link>

            <Link to="/messages">
              <GlassCard
                hoverable
                padding="md"
                className="flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-white">پیام‌ها</span>
              </GlassCard>
            </Link>

            <Link to="/receipts">
              <GlassCard
                hoverable
                padding="md"
                className="flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🧾</span>
                </div>
                <span className="text-sm font-medium text-white">رسیدها</span>
              </GlassCard>
            </Link>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
