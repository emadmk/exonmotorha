import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  User,
  UserCheck,
  AlertCircle,
  Save,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusChip } from '../components/ui/StatusChip';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { orderAPI, adminAPI } from '../services/api';
import { Order, OrderStatus } from '../types';
import { cn, formatCurrency, formatDateSmart, toPersianDigits } from '../utils/helpers';

interface Technician {
  _id: string;
  name: string;
  phone: string;
  isActive: boolean;
  technicianInfo?: {
    specialties: string[];
    rating: number;
    isAvailable: boolean;
  };
  activeOrders: number;
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'planned', label: 'برنامه‌ریزی شده' },
  { value: 'in_progress', label: 'در حال انجام' },
  { value: 'waiting_for_parts', label: 'انتظار قطعه' },
  { value: 'completed', label: 'تکمیل شده' },
  { value: 'cancelled', label: 'لغو شده' },
];

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadOrder();
      loadTechnicians();
    }
  }, [id]);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const response = await orderAPI.getOne(id!);
      const orderData = response.data.order;
      setOrder(orderData);
      setSelectedStatus(orderData.status);
      setAdminNotes(orderData.adminNotes || '');
      if (orderData.technicianId) {
        const techId = typeof orderData.technicianId === 'object'
          ? (orderData.technicianId as any)._id
          : orderData.technicianId;
        setSelectedTechnician(techId);
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const response = await adminAPI.getTechnicians();
      setTechnicians(response.data.technicians || []);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order || !selectedStatus) return;

    setIsSaving(true);
    try {
      await orderAPI.updateStatus(order._id, selectedStatus, adminNotes);
      loadOrder();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignTechnician = async (techId: string) => {
    if (!order) return;

    setIsSaving(true);
    try {
      await orderAPI.assignTechnician(order._id, techId);
      setSelectedTechnician(techId);
      setShowTechnicianModal(false);
      loadOrder();
    } catch (error) {
      console.error('Error assigning technician:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getVehicleInfo = () => {
    if (!order) return null;
    const vehicle = order.vehicleId as any;
    if (vehicle && typeof vehicle === 'object' && vehicle.brand) {
      return vehicle;
    }
    return { brand: 'خودرو حذف شده', model: '', year: '', plateNumber: '' };
  };

  const getCustomerInfo = () => {
    if (!order) return null;
    const customer = order.userId as any;
    if (customer && typeof customer === 'object') {
      return { ...customer, name: customer.name || 'کاربر حذف شده', phone: customer.phone || '-' };
    }
    return { name: 'کاربر حذف شده', phone: '-' };
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
      <div className="min-h-screen bg-dark-950 p-4">
        <header className="max-w-4xl mx-auto mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-dark-400 hover:text-white"
          >
            <ArrowRight className="w-5 h-5" />
            بازگشت به پنل مدیریت
          </button>
        </header>

        <div className="max-w-4xl mx-auto">
          <GlassCard padding="lg" className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <p className="text-dark-400">سفارش یافت نشد</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  const vehicle = getVehicleInfo();
  const customer = getCustomerInfo();
  const technician = getTechnicianInfo();

  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-dark-400 hover:text-white mb-4"
        >
          <ArrowRight className="w-5 h-5" />
          بازگشت به پنل مدیریت
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              سفارش {order.orderNumber}
            </h1>
            <p className="text-dark-400 text-sm">
              {formatDateSmart(order.createdAt)}
            </p>
          </div>
          <StatusChip status={order.status} size="lg" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto grid gap-4 md:grid-cols-2">
        {/* Customer Info */}
        {customer && (
          <GlassCard padding="md">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-gold-500" />
              اطلاعات مشتری
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-dark-400">نام</span>
                <span className="text-white">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">شماره تماس</span>
                <a href={`tel:${customer.phone}`} className="text-gold-500" dir="ltr">
                  {customer.phone}
                </a>
              </div>
              {customer.nationalId && (
                <div className="flex justify-between">
                  <span className="text-dark-400">کد ملی</span>
                  <span className="text-white" dir="ltr">{customer.nationalId}</span>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Vehicle Info */}
        {vehicle && (
          <GlassCard padding="md">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Car className="w-5 h-5 text-gold-500" />
              اطلاعات خودرو
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-dark-400">برند و مدل</span>
                <span className="text-white">{vehicle.brand} {vehicle.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">سال</span>
                <span className="text-white">{toPersianDigits(vehicle.year)}</span>
              </div>
              {vehicle.color && (
                <div className="flex justify-between">
                  <span className="text-dark-400">رنگ</span>
                  <span className="text-white">{vehicle.color}</span>
                </div>
              )}
              {vehicle.plateNumber && (
                <div className="flex justify-between">
                  <span className="text-dark-400">پلاک</span>
                  <span className="text-white" dir="ltr">{vehicle.plateNumber}</span>
                </div>
              )}
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

        {/* Location */}
        {order.location && (
          <GlassCard padding="md">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold-500" />
              موقعیت مکانی
            </h3>
            <p className="text-dark-300 mb-2">{order.location.address}</p>
            {order.location.coordinates && (
              <a
                href={`https://www.google.com/maps?q=${order.location.coordinates.lat},${order.location.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-500 text-sm hover:text-gold-400"
              >
                مشاهده در نقشه
              </a>
            )}
          </GlassCard>
        )}

        {/* Technician Assignment */}
        <GlassCard padding="md" className="md:col-span-2">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-gold-500" />
            تعمیرکار
          </h3>

          {technician ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-gold-500">
                    {technician.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">{technician.name}</p>
                  <p className="text-sm text-dark-400" dir="ltr">{technician.phone}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowTechnicianModal(true)}
              >
                تغییر تعمیرکار
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-dark-400 mb-4">تعمیرکاری اختصاص داده نشده</p>
              <Button onClick={() => setShowTechnicianModal(true)}>
                <UserCheck className="w-4 h-4 ml-2" />
                اختصاص تعمیرکار
              </Button>
            </div>
          )}
        </GlassCard>

        {/* Status Update */}
        <GlassCard padding="md" className="md:col-span-2">
          <h3 className="font-semibold text-white mb-4">تغییر وضعیت</h3>

          <div className="flex flex-wrap gap-2 mb-4">
            {statusOptions.map((status) => (
              <button
                key={status.value}
                onClick={() => setSelectedStatus(status.value)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  selectedStatus === status.value
                    ? 'bg-gold-600 text-dark-950'
                    : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                )}
              >
                {status.label}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-dark-400 text-sm mb-2">یادداشت مدیر</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="یادداشت برای این سفارش..."
              className="input w-full min-h-[100px] resize-none"
            />
          </div>

          <Button
            onClick={handleUpdateStatus}
            isLoading={isSaving}
            disabled={selectedStatus === order.status && adminNotes === (order.adminNotes || '')}
          >
            <Save className="w-4 h-4 ml-2" />
            ذخیره تغییرات
          </Button>
        </GlassCard>
      </div>

      {/* Technician Selection Modal */}
      {showTechnicianModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-dark-900 rounded-2xl w-full max-w-lg border border-dark-700 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white">انتخاب تعمیرکار</h3>
              <button
                onClick={() => setShowTechnicianModal(false)}
                className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {technicians.length === 0 ? (
                <p className="text-center text-dark-400 py-8">
                  تعمیرکاری یافت نشد
                </p>
              ) : (
                <div className="space-y-3">
                  {technicians.map((tech) => (
                    <button
                      key={tech._id}
                      onClick={() => handleAssignTechnician(tech._id)}
                      disabled={isSaving}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 text-right transition-all',
                        selectedTechnician === tech._id
                          ? 'border-gold-600 bg-gold-600/10'
                          : 'border-dark-700 hover:border-dark-600'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center">
                          <span className="font-bold text-gold-500">
                            {tech.name?.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-white">{tech.name}</p>
                            {tech.technicianInfo?.isAvailable ? (
                              <span className="px-2 py-0.5 bg-emerald-600/20 text-emerald-400 text-xs rounded-full">
                                آزاد
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-600/20 text-amber-400 text-xs rounded-full">
                                مشغول
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-dark-400" dir="ltr">{tech.phone}</p>
                          <div className="flex items-center gap-4 text-xs text-dark-500 mt-1">
                            <span>سفارش فعال: {tech.activeOrders}</span>
                            {tech.technicianInfo && (
                              <span>امتیاز: {tech.technicianInfo.rating}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
