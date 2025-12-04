import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  Activity,
  RefreshCw,
  X,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { activityLogAPI } from '../services/api';
import { toPersianDigits } from '../utils/helpers';

interface ActivityLog {
  _id: string;
  action: string;
  category: string;
  description: string;
  performedBy: {
    _id: string;
    name: string;
    phone: string;
  };
  performerRole: string;
  performerName: string;
  targetType?: string;
  targetId?: string;
  targetRef?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const CATEGORIES = [
  { value: '', label: 'همه دسته‌ها' },
  { value: 'order', label: 'سفارش' },
  { value: 'user', label: 'کاربر' },
  { value: 'auth', label: 'احراز هویت' },
  { value: 'receipt', label: 'فاکتور' },
  { value: 'message', label: 'پیام' },
  { value: 'vehicle', label: 'خودرو' },
];

const ROLES = [
  { value: '', label: 'همه نقش‌ها' },
  { value: 'admin', label: 'ادمین' },
  { value: 'technician', label: 'تکنسین' },
  { value: 'customer', label: 'مشتری' },
];

const categoryColors: Record<string, string> = {
  order: 'bg-blue-500/20 text-blue-400',
  user: 'bg-purple-500/20 text-purple-400',
  auth: 'bg-green-500/20 text-green-400',
  receipt: 'bg-yellow-500/20 text-yellow-400',
  message: 'bg-pink-500/20 text-pink-400',
  vehicle: 'bg-cyan-500/20 text-cyan-400',
  system: 'bg-gray-500/20 text-gray-400',
};

const roleColors: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400',
  technician: 'bg-orange-500/20 text-orange-400',
  customer: 'bg-emerald-500/20 text-emerald-400',
};

const roleLabels: Record<string, string> = {
  admin: 'ادمین',
  technician: 'تکنسین',
  customer: 'مشتری',
};

const categoryLabels: Record<string, string> = {
  order: 'سفارش',
  user: 'کاربر',
  auth: 'احراز هویت',
  receipt: 'فاکتور',
  message: 'پیام',
  vehicle: 'خودرو',
  system: 'سیستم',
};

export function ActivityLogPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [performerRole, setPerformerRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await activityLogAPI.getLogs({
        page,
        limit: 20,
        category: category || undefined,
        performerRole: performerRole || undefined,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSearch = () => {
    loadLogs(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setPerformerRole('');
    setStartDate('');
    setEndDate('');
    setTimeout(() => loadLogs(1), 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 text-dark-400 hover:text-white"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-gold-500" />
              <h1 className="text-lg font-bold text-white">لاگ فعالیت‌ها</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              فیلتر
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadLogs(pagination.page)}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters Panel */}
        {showFilters && (
          <GlassCard className="mb-6 p-4">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm text-dark-400 mb-1">جستجو</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="جستجو در توضیحات..."
                    className="w-full pr-10 pl-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white text-sm focus:border-gold-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="min-w-[150px]">
                <label className="block text-sm text-dark-400 mb-1">دسته‌بندی</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white text-sm focus:border-gold-600 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div className="min-w-[150px]">
                <label className="block text-sm text-dark-400 mb-1">نقش</label>
                <select
                  value={performerRole}
                  onChange={(e) => setPerformerRole(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white text-sm focus:border-gold-600 focus:outline-none"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="min-w-[150px]">
                <label className="block text-sm text-dark-400 mb-1">از تاریخ</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white text-sm focus:border-gold-600 focus:outline-none"
                />
              </div>

              {/* End Date */}
              <div className="min-w-[150px]">
                <label className="block text-sm text-dark-400 mb-1">تا تاریخ</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white text-sm focus:border-gold-600 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-end gap-2">
                <Button size="sm" onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                  اعمال
                </Button>
                <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                  <X className="w-4 h-4" />
                  پاک کردن
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Stats */}
        <div className="mb-4 text-sm text-dark-400">
          مجموع: {toPersianDigits(pagination.total)} مورد
        </div>

        {/* Logs List */}
        <GlassCard className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-dark-400">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
              در حال بارگذاری...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-dark-400">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              هیچ لاگی یافت نشد
            </div>
          ) : (
            <div className="divide-y divide-dark-700/50">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="p-4 hover:bg-dark-800/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-gold-500" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Category Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            categoryColors[log.category] || categoryColors.system
                          }`}
                        >
                          {categoryLabels[log.category] || log.category}
                        </span>

                        {/* Role Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            roleColors[log.performerRole] || roleColors.customer
                          }`}
                        >
                          {roleLabels[log.performerRole] || log.performerRole}
                        </span>

                        {/* Target Reference */}
                        {log.targetRef && (
                          <span className="text-xs text-gold-500 font-mono">
                            {log.targetRef}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-white mb-2">{log.description}</p>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-dark-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.performerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(log.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(log.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-dark-700/50 flex items-center justify-between">
              <div className="text-sm text-dark-400">
                صفحه {toPersianDigits(pagination.page)} از {toPersianDigits(pagination.pages)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => loadLogs(pagination.page - 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                  قبلی
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => loadLogs(pagination.page + 1)}
                >
                  بعدی
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      </main>
    </div>
  );
}
