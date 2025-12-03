import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  Wrench,
  Package,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  AlertCircle,
  Camera,
  X,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusChip } from '../components/ui/StatusChip';
import { Button } from '../components/ui/Button';
import { BottomNav } from '../components/layout/BottomNav';
import { orderAPI, messageAPI } from '../services/api';
import { Order, OrderStatus, PHOTO_TYPE_LABELS, PhotoType } from '../types';
import { cn, formatCurrency, formatDateSmart, toPersianDigits } from '../utils/helpers';

const statusSteps: { key: OrderStatus; label: string; icon: typeof Clock }[] = [
  { key: 'pending', label: 'در انتظار تایید', icon: Clock },
  { key: 'planned', label: 'برنامه‌ریزی شده', icon: Calendar },
  { key: 'in_progress', label: 'در حال انجام', icon: Wrench },
  { key: 'waiting_for_parts', label: 'انتظار قطعه', icon: Package },
  { key: 'completed', label: 'تکمیل شده', icon: CheckCircle },
];

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const response = await orderAPI.getOne(id!);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !confirm('آیا از لغو سفارش مطمئن هستید؟')) return;

    setIsCancelling(true);
    try {
      await orderAPI.cancel(order._id);
      loadOrder();
    } catch (error) {
      console.error('Error cancelling order:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleStartChat = async () => {
    if (!order || isStartingChat) return;

    setIsStartingChat(true);
    try {
      const response = await messageAPI.startOrderChat(order._id);
      // Navigate to messages page - the conversation will be shown
      navigate('/messages', { state: { conversationId: response.data.conversation._id } });
    } catch (error: any) {
      console.error('Error starting chat:', error);
      // If technician not assigned, show message
      if (error.response?.status === 400) {
        alert('هنوز تکنسینی به این سفارش اختصاص نیافته');
      }
    } finally {
      setIsStartingChat(false);
    }
  };

  const getStatusIndex = (status: OrderStatus): number => {
    if (status === 'cancelled') return -1;
    return statusSteps.findIndex((s) => s.key === status);
  };

  const getVehicleInfo = () => {
    if (!order) return null;
    const vehicle = order.vehicleId as any;
    if (vehicle && typeof vehicle === 'object' && vehicle.brand) {
      return vehicle;
    }
    return { brand: 'خودرو', model: '', year: '', plateNumber: '' };
  };

  const getTechnicianInfo = () => {
    if (!order) return null;
    const technician = order.technicianId as any;
    if (technician && typeof technician === 'object') {
      return { ...technician, name: technician.name || 'تکنسین' };
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-dark-950 pb-24">
        <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
          <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
            <Link to="/orders" className="p-2 -mr-2 text-dark-400 hover:text-white">
              <ArrowRight className="w-6 h-6" />
            </Link>
            <h1 className="flex-1 text-center font-semibold text-white">جزئیات سفارش</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-6">
          <GlassCard padding="lg" className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <p className="text-dark-400">سفارش یافت نشد</p>
            <Link to="/orders" className="btn-primary inline-block mt-4">
              بازگشت به سفارش‌ها
            </Link>
          </GlassCard>
        </main>

        <BottomNav />
      </div>
    );
  }

  const vehicle = getVehicleInfo();
  const technician = getTechnicianInfo();
  const currentStepIndex = getStatusIndex(order.status);

  return (
    <div className="min-h-screen bg-dark-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
          <Link to="/orders" className="p-2 -mr-2 text-dark-400 hover:text-white">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center font-semibold text-white">
            سفارش {order.orderNumber}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Status Card */}
        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-4">
            <StatusChip status={order.status} size="md" />
            <p className="text-sm text-dark-400">{formatDateSmart(order.createdAt)}</p>
          </div>

          {/* Progress Steps */}
          {order.status !== 'cancelled' && (
            <div className="relative">
              <div className="flex justify-between">
                {statusSteps.map((step, index) => {
                  const isActive = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                          isActive
                            ? 'bg-gold-600 text-dark-950'
                            : 'bg-dark-800 text-dark-500'
                        )}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <span
                        className={cn(
                          'text-[10px] mt-2 text-center leading-tight',
                          isActive ? 'text-gold-500' : 'text-dark-500'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-dark-700 -z-10">
                <div
                  className="h-full bg-gold-600 transition-all duration-500"
                  style={{
                    width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {order.status === 'cancelled' && (
            <div className="flex items-center gap-3 p-3 bg-red-600/10 rounded-xl">
              <XCircle className="w-6 h-6 text-red-400" />
              <span className="text-red-400">این سفارش لغو شده است</span>
            </div>
          )}
        </GlassCard>

        {/* Vehicle Info */}
        {vehicle && (
          <GlassCard padding="md">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Car className="w-5 h-5 text-gold-500" />
              اطلاعات خودرو
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-dark-400">برند و مدل</span>
                <p className="text-white">{vehicle.brand} {vehicle.model}</p>
              </div>
              <div>
                <span className="text-dark-400">سال</span>
                <p className="text-white">{toPersianDigits(vehicle.year)}</p>
              </div>
              <div>
                <span className="text-dark-400">رنگ</span>
                <p className="text-white">{vehicle.color}</p>
              </div>
              <div>
                <span className="text-dark-400">پلاک</span>
                <p className="text-white" dir="ltr">{vehicle.plateNumber}</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Issues */}
        <GlassCard padding="md">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-gold-500" />
            مشکلات گزارش شده
          </h3>
          <div className="flex flex-wrap gap-2">
            {order.issues.map((issue, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-dark-800 rounded-lg text-sm text-dark-300"
              >
                {issue}
              </span>
            ))}
          </div>
          {order.description && (
            <p className="text-dark-400 text-sm mt-3 p-3 bg-dark-800/50 rounded-lg">
              {order.description}
            </p>
          )}
        </GlassCard>

        {/* Technician Info */}
        {technician && (
          <GlassCard padding="md">
            <h3 className="font-semibold text-white mb-3">تعمیرکار</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center">
                  {technician.avatar ? (
                    <img
                      src={technician.avatar}
                      alt={technician.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gold-500">
                      {technician.name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{technician.name}</p>
                  <p className="text-sm text-dark-400">تعمیرکار</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${technician.phone}`}
                  className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center text-dark-400 hover:text-emerald-400 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </a>
                <button
                  onClick={handleStartChat}
                  disabled={isStartingChat}
                  className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center text-dark-400 hover:text-gold-400 transition-colors disabled:opacity-50"
                >
                  {isStartingChat ? (
                    <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MessageSquare className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Photos from Technician */}
        {order.photos && order.photos.length > 0 && (
          <GlassCard padding="md">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Camera className="w-5 h-5 text-gold-500" />
              تصاویر
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {order.photos.map((photo) => (
                <div key={photo._id} className="relative aspect-square">
                  <img
                    src={photo.url}
                    alt={PHOTO_TYPE_LABELS[photo.type as PhotoType] || 'تصویر'}
                    className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setViewingPhoto(photo.url)}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 rounded-b-lg">
                    <span className="text-xs text-white">{PHOTO_TYPE_LABELS[photo.type as PhotoType] || 'سایر'}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Schedule Info */}
        {order.scheduledDate && (
          <GlassCard padding="md">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold-500" />
              زمان‌بندی
            </h3>
            <p className="text-dark-300">{formatDateSmart(order.scheduledDate)}</p>
          </GlassCard>
        )}

        {/* Location */}
        {order.location && (
          <GlassCard padding="md">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold-500" />
              آدرس
            </h3>
            <p className="text-dark-300">{order.location.address}</p>
          </GlassCard>
        )}

        {/* Estimated Cost */}
        {order.estimatedCostMin && (
          <GlassCard padding="md">
            <div className="flex items-center justify-between">
              <span className="text-dark-400">هزینه تخمینی</span>
              <span className="text-lg font-bold text-gold-500">
                {formatCurrency(order.estimatedCostMin)}
                {order.estimatedCostMax && ` - ${formatCurrency(order.estimatedCostMax)}`}
              </span>
            </div>
          </GlassCard>
        )}

        {/* Actions */}
        {order.status === 'pending' && (
          <Button
            variant="outline"
            onClick={handleCancelOrder}
            isLoading={isCancelling}
            fullWidth
            className="!border-red-600/50 !text-red-400 hover:!bg-red-600/10"
          >
            <XCircle className="w-5 h-5 ml-2" />
            لغو سفارش
          </Button>
        )}
      </main>

      <BottomNav />

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <button
            onClick={() => setViewingPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-dark-800/80 rounded-full text-white hover:bg-dark-700"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={viewingPhoto}
            alt="تصویر"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
