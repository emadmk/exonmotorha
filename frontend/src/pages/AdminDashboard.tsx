import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Plus,
  Search,
  Calendar,
  Clock,
  Package,
  CheckCircle,
  TrendingUp,
  Car,
  User,
  Phone,
  Eye,
  X,
  Loader2,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusChip } from '../components/ui/StatusChip';
import { useAuthStore } from '../stores/authStore';
import { adminAPI, orderAPI } from '../services/api';
import { Order, DashboardStats, OrderStatus } from '../types';
import { cn, formatNumber, formatDateSmart, formatCurrency } from '../utils/helpers';

interface Technician {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  technicianInfo?: {
    specialties: string[];
    rating: number;
    totalJobs: number;
    completedJobs: number;
    isAvailable: boolean;
  };
  activeOrders: number;
}

type Tab = 'dashboard' | 'orders' | 'technicians' | 'settings';

const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'planned', label: 'برنامه‌ریزی شده' },
  { value: 'in_progress', label: 'در حال انجام' },
  { value: 'waiting_for_parts', label: 'انتظار قطعه' },
  { value: 'completed', label: 'تکمیل شده' },
  { value: 'cancelled', label: 'لغو شده' },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const response = await adminAPI.getStats();
        setStats(response.data.stats);
      }

      if (activeTab === 'dashboard' || activeTab === 'orders') {
        const params: any = {};
        if (statusFilter !== 'all') params.status = statusFilter;
        if (searchQuery) params.search = searchQuery;

        const response = await orderAPI.getAll(params);
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getVehicleInfo = (order: Order) => {
    const vehicle = order.vehicleId as any;
    if (typeof vehicle === 'object') {
      return `${vehicle.brand} ${vehicle.model}`;
    }
    return '-';
  };

  const getCustomerInfo = (order: Order) => {
    const customer = order.userId as any;
    if (typeof customer === 'object') {
      return { name: customer.name, phone: customer.phone };
    }
    return { name: '-', phone: '-' };
  };

  const navItems = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'orders', label: 'سفارش‌ها', icon: ClipboardList },
    { id: 'technicians', label: 'تکنسین‌ها', icon: Users },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-900 border-l border-dark-700/50">
        {/* Logo */}
        <div className="p-6 border-b border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-gold rounded-xl flex items-center justify-center">
              <span className="text-dark-950 font-bold">اکسون</span>
            </div>
            <div>
              <p className="font-bold text-white">اکسون موتور</p>
              <p className="text-xs text-dark-400">پنل مدیریت</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                activeTab === item.id
                  ? 'bg-gold-600/20 text-gold-500'
                  : 'text-dark-400 hover:bg-dark-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-dark-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-dark-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-dark-400">مدیر</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-dark-800 text-dark-400 rounded-xl hover:bg-red-600/20 hover:text-red-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-dark-900 border-b border-dark-700/50">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-gold rounded-lg flex items-center justify-center">
              <span className="text-dark-950 font-bold text-sm">اکسون</span>
            </div>
            <span className="font-bold text-white">پنل مدیریت</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-dark-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Tabs */}
        <div className="flex overflow-x-auto no-scrollbar border-t border-dark-800">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm',
                activeTab === item.id
                  ? 'text-gold-500 border-b-2 border-gold-500'
                  : 'text-dark-400'
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 pt-32 md:pt-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-white">داشبورد</h1>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {stats ? formatNumber(stats.orders.today) : '۰'}
                      </p>
                      <p className="text-sm text-dark-400">سفارش امروز</p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {stats ? formatNumber(stats.orders.inProgress) : '۰'}
                      </p>
                      <p className="text-sm text-dark-400">در حال انجام</p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {stats ? formatNumber(stats.orders.waitingForParts) : '۰'}
                      </p>
                      <p className="text-sm text-dark-400">انتظار قطعه</p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {stats ? formatNumber(stats.orders.completed) : '۰'}
                      </p>
                      <p className="text-sm text-dark-400">تکمیل شده</p>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Revenue Card */}
              <GlassCard padding="md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-gold rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 text-dark-950" />
                    </div>
                    <div>
                      <p className="text-dark-400 text-sm">درآمد کل</p>
                      <p className="text-2xl font-bold text-white">
                        {stats ? formatCurrency(stats.revenue.total) : '۰ تومان'}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Recent Orders */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">سفارش‌های اخیر</h2>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-gold-500 text-sm hover:text-gold-400"
                  >
                    مشاهده همه
                  </button>
                </div>

                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <Link key={order._id} to={`/admin/orders/${order._id}`}>
                      <GlassCard hoverable padding="sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-dark-800 rounded-lg flex items-center justify-center">
                              <Car className="w-5 h-5 text-gold-500" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {order.orderNumber}
                              </p>
                              <p className="text-sm text-dark-400">
                                {getCustomerInfo(order).name}
                              </p>
                            </div>
                          </div>
                          <StatusChip status={order.status} size="sm" />
                        </div>
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white">سفارش‌ها</h1>

                <div className="flex gap-3">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                    <input
                      type="text"
                      placeholder="جستجو..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadData()}
                      className="input pr-10 w-full sm:w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Status Filters */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
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
                  <ClipboardList className="w-16 h-16 mx-auto mb-4 text-dark-600" />
                  <p className="text-dark-400">سفارشی یافت نشد</p>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Link key={order._id} to={`/admin/orders/${order._id}`}>
                      <GlassCard hoverable padding="md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-dark-800 rounded-xl flex items-center justify-center">
                              <Car className="w-6 h-6 text-gold-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-white">
                                  {order.orderNumber}
                                </span>
                                <StatusChip status={order.status} size="sm" />
                              </div>
                              <p className="text-sm text-dark-400">
                                {getVehicleInfo(order)} • {order.issues.slice(0, 2).join('، ')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="text-left sm:text-right">
                              <p className="text-sm text-white">
                                {getCustomerInfo(order).name}
                              </p>
                              <p className="text-xs text-dark-400">
                                {formatDateSmart(order.createdAt)}
                              </p>
                            </div>
                            <Eye className="w-5 h-5 text-dark-500" />
                          </div>
                        </div>
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Technicians Tab */}
          {activeTab === 'technicians' && (
            <TechniciansSection />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-white">تنظیمات</h1>

              <GlassCard padding="lg">
                <p className="text-dark-400">
                  تنظیمات سیستم در این بخش قرار می‌گیرد
                </p>
              </GlassCard>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Technicians Section Component
function TechniciansSection() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [newTechnician, setNewTechnician] = useState({
    phone: '',
    name: '',
    email: '',
    specialties: '',
  });

  useEffect(() => {
    loadTechnicians();
  }, []);

  const loadTechnicians = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getTechnicians();
      setTechnicians(response.data.technicians || []);
    } catch (error) {
      console.error('Error loading technicians:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTechnician = async () => {
    if (!newTechnician.phone || !newTechnician.name) {
      setError('نام و شماره موبایل الزامی است');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await adminAPI.createTechnician({
        phone: newTechnician.phone,
        name: newTechnician.name,
        email: newTechnician.email || undefined,
        specialties: newTechnician.specialties
          ? newTechnician.specialties.split('،').map(s => s.trim())
          : [],
      });

      setShowModal(false);
      setNewTechnician({ phone: '', name: '', email: '', specialties: '' });
      loadTechnicians();
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ایجاد تکنسین');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">تکنسین‌ها</h1>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 ml-2" />
          افزودن تکنسین
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="spinner" />
        </div>
      ) : technicians.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-dark-600" />
          <p className="text-dark-400 mb-4">هنوز تکنسینی ثبت نشده</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 ml-2" />
            افزودن اولین تکنسین
          </Button>
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {technicians.map((tech) => (
            <GlassCard key={tech._id} padding="md">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white truncate">{tech.name}</p>
                    {tech.technicianInfo?.isAvailable ? (
                      <span className="px-2 py-0.5 bg-emerald-600/20 text-emerald-400 text-xs rounded-full">
                        فعال
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded-full">
                        غیرفعال
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-dark-400 mb-2" dir="ltr">{tech.phone}</p>

                  <div className="flex items-center gap-4 text-xs text-dark-400">
                    <span>سفارش فعال: {tech.activeOrders}</span>
                    {tech.technicianInfo && (
                      <>
                        <span>امتیاز: {tech.technicianInfo.rating}</span>
                        <span>تکمیل: {tech.technicianInfo.completedJobs}</span>
                      </>
                    )}
                  </div>

                  {tech.technicianInfo?.specialties && tech.technicianInfo.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tech.technicianInfo.specialties.slice(0, 3).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-dark-800 text-dark-300 text-xs rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Add Technician Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-dark-900 rounded-2xl w-full max-w-md border border-dark-700">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white">افزودن تکنسین جدید</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <Input
                placeholder="شماره موبایل *"
                value={newTechnician.phone}
                onChange={(e) => setNewTechnician({ ...newTechnician, phone: e.target.value })}
                dir="ltr"
              />
              <Input
                placeholder="نام و نام خانوادگی *"
                value={newTechnician.name}
                onChange={(e) => setNewTechnician({ ...newTechnician, name: e.target.value })}
              />
              <Input
                placeholder="ایمیل (اختیاری)"
                type="email"
                value={newTechnician.email}
                onChange={(e) => setNewTechnician({ ...newTechnician, email: e.target.value })}
                dir="ltr"
              />
              <Input
                placeholder="تخصص‌ها (با ، جدا کنید)"
                value={newTechnician.specialties}
                onChange={(e) => setNewTechnician({ ...newTechnician, specialties: e.target.value })}
              />

              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>

            <div className="flex gap-3 p-4 border-t border-dark-700">
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
                fullWidth
              >
                انصراف
              </Button>
              <Button
                onClick={handleCreateTechnician}
                isLoading={isSubmitting}
                fullWidth
              >
                افزودن
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
