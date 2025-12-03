import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  User,
  Settings,
  LogOut,
  Car,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  MessageSquare,
  Camera,
  Mail,
  Save,
  Edit2,
  DollarSign,
  FileText,
  Play,
  Pause,
  Package,
  Send,
  Image,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusChip } from '../components/ui/StatusChip';
import { CameraCapture } from '../components/ui/CameraCapture';
import { useAuthStore } from '../stores/authStore';
import { orderAPI, userAPI, messageAPI } from '../services/api';
import { Order, OrderStatus, PhotoType, PHOTO_TYPE_LABELS } from '../types';
import { cn, formatNumber, formatDateSmart, toPersianDigits } from '../utils/helpers';

type Tab = 'dashboard' | 'orders' | 'chat' | 'settings';

const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'in_progress', label: 'در حال انجام' },
  { value: 'waiting_for_parts', label: 'انتظار قطعه' },
  { value: 'completed', label: 'تکمیل شده' },
];

export function TechnicianDashboard() {
  const navigate = useNavigate();
  const { user, logout, fetchUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Order workflow state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showCostForm, setShowCostForm] = useState(false);
  const [costFormData, setCostFormData] = useState({
    estimatedCostMin: '',
    estimatedCostMax: '',
    notes: '',
  });
  const [technicianNotes, setTechnicianNotes] = useState('');

  // Photo capture state
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoTypeSelect, setShowPhotoTypeSelect] = useState(false);
  const [selectedPhotoType, setSelectedPhotoType] = useState<PhotoType>('vehicle');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // Chat state
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await orderAPI.getAssigned(params);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      // Update profile
      await userAPI.updateProfile({
        name: profileFormData.name,
        email: profileFormData.email || undefined,
      });

      // Upload avatar if changed
      if (avatarFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', avatarFile);
        await userAPI.uploadAvatar(formDataUpload);
      }

      await fetchUser();
      setIsEditingProfile(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileFormData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // Order workflow functions
  const handleUpdateOrderStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    try {
      await orderAPI.technicianUpdate(selectedOrder._id, { status: newStatus });
      // Reload order
      const response = await orderAPI.getOne(selectedOrder._id);
      setSelectedOrder(response.data.order);
      // Reload orders list
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSubmitCostEstimate = async () => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    try {
      await orderAPI.technicianUpdate(selectedOrder._id, {
        estimatedCostMin: Number(costFormData.estimatedCostMin),
        estimatedCostMax: Number(costFormData.estimatedCostMax) || Number(costFormData.estimatedCostMin),
        notes: costFormData.notes,
      });
      // Reload order
      const response = await orderAPI.getOne(selectedOrder._id);
      setSelectedOrder(response.data.order);
      setShowCostForm(false);
      setCostFormData({ estimatedCostMin: '', estimatedCostMax: '', notes: '' });
    } catch (error) {
      console.error('Error submitting cost estimate:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateTimeline = async (stepIndex: number) => {
    if (!selectedOrder) return;
    const step = selectedOrder.timeline[stepIndex];
    if (!step || step.status === 'completed') return;

    setIsUpdatingStatus(true);
    try {
      await orderAPI.updateTimeline(selectedOrder._id, step._id || '', {
        status: 'completed',
      });
      // Reload order
      const response = await orderAPI.getOne(selectedOrder._id);
      setSelectedOrder(response.data.order);
    } catch (error) {
      console.error('Error updating timeline:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    try {
      await orderAPI.technicianUpdate(selectedOrder._id, { notes: technicianNotes });
      // Reload order
      const response = await orderAPI.getOne(selectedOrder._id);
      setSelectedOrder(response.data.order);
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Photo capture functions
  const handleOpenCamera = (type: PhotoType) => {
    setSelectedPhotoType(type);
    setShowPhotoTypeSelect(false);
    setShowCamera(true);
  };

  const handlePhotoCapture = async (file: File) => {
    if (!selectedOrder) return;
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('type', selectedPhotoType);

      await orderAPI.uploadPhoto(selectedOrder._id, formData);
      // Reload order to get updated photos
      const response = await orderAPI.getOne(selectedOrder._id);
      setSelectedOrder(response.data.order);
      setShowCamera(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!selectedOrder) return;
    setDeletingPhotoId(photoId);
    try {
      await orderAPI.deletePhoto(selectedOrder._id, photoId);
      // Reload order to get updated photos
      const response = await orderAPI.getOne(selectedOrder._id);
      setSelectedOrder(response.data.order);
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setDeletingPhotoId(null);
    }
  };

  // Initialize notes when order is selected
  useEffect(() => {
    if (selectedOrder) {
      setTechnicianNotes(selectedOrder.notes || '');
    }
  }, [selectedOrder?._id]);

  // Load conversations when chat tab is active
  useEffect(() => {
    if (activeTab === 'chat') {
      loadConversations();
    }
  }, [activeTab]);

  // Chat functions
  const loadConversations = async () => {
    setIsLoadingChat(true);
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await messageAPI.getMessages(conversationId);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSelectConversation = async (conv: any) => {
    setSelectedConversation(conv);
    await loadMessages(conv._id);
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      await messageAPI.sendMessage(selectedConversation._id, newMessage.trim());
      setNewMessage('');
      loadMessages(selectedConversation._id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getOtherParticipant = (conv: any) => {
    if (!conv.participants || !Array.isArray(conv.participants)) return 'نامشخص';
    const other = conv.participants.find((p: any) => p && p._id !== user?.id);
    return other?.name || 'کاربر';
  };

  const getSenderName = (msg: any) => {
    if (!msg.senderId) return 'سیستم';
    if (typeof msg.senderId === 'object') {
      return msg.senderId?.name || 'کاربر';
    }
    return 'کاربر';
  };

  const getVehicleInfo = (order: Order) => {
    const vehicle = order.vehicleId as any;
    if (vehicle && typeof vehicle === 'object' && vehicle.brand) {
      return `${vehicle.brand} ${vehicle.model || ''}`.trim();
    }
    return 'خودرو حذف شده';
  };

  const getCustomerInfo = (order: Order) => {
    const customer = order.userId as any;
    if (customer && typeof customer === 'object') {
      return { name: customer.name || 'مشتری', phone: customer.phone || '-' };
    }
    return { name: 'کاربر حذف شده', phone: '-' };
  };

  const stats = {
    total: orders.length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    waitingParts: orders.filter(o => o.status === 'waiting_for_parts').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const navItems = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'orders', label: 'سفارش‌ها', icon: ClipboardList },
    { id: 'chat', label: 'پیام‌ها', icon: MessageSquare },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-900 border-l border-dark-700/50">
        <div className="p-6 border-b border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">پنل تکنسین</p>
              <p className="text-xs text-dark-400">اکسون موتور</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                activeTab === item.id
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-dark-400 hover:bg-dark-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-dark-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-dark-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-dark-400">تکنسین</p>
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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">پنل تکنسین</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-dark-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="flex overflow-x-auto no-scrollbar border-t border-dark-800">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm',
                activeTab === item.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
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
              <h1 className="text-2xl font-bold text-white">سلام {user?.name}</h1>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{toPersianDigits(stats.total)}</p>
                      <p className="text-sm text-dark-400">کل سفارش‌ها</p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{toPersianDigits(stats.inProgress)}</p>
                      <p className="text-sm text-dark-400">در حال انجام</p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{toPersianDigits(stats.waitingParts)}</p>
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
                      <p className="text-2xl font-bold text-white">{toPersianDigits(stats.completed)}</p>
                      <p className="text-sm text-dark-400">تکمیل شده</p>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Active Orders */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">سفارش‌های فعال</h2>
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="spinner" />
                  </div>
                ) : orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length === 0 ? (
                  <GlassCard padding="lg" className="text-center">
                    <ClipboardList className="w-16 h-16 mx-auto mb-4 text-dark-600" />
                    <p className="text-dark-400">سفارش فعالی ندارید</p>
                  </GlassCard>
                ) : (
                  <div className="space-y-3">
                    {orders
                      .filter(o => o.status !== 'completed' && o.status !== 'cancelled')
                      .map((order) => (
                        <GlassCard
                          key={order._id}
                          hoverable
                          padding="md"
                          onClick={() => setSelectedOrder(order)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-dark-800 rounded-xl flex items-center justify-center">
                                <Car className="w-6 h-6 text-blue-400" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-white">{order.orderNumber}</span>
                                  <StatusChip status={order.status} size="sm" />
                                </div>
                                <p className="text-sm text-dark-400">
                                  {getVehicleInfo(order)} • {getCustomerInfo(order).name}
                                </p>
                              </div>
                            </div>
                            <ChevronLeft className="w-5 h-5 text-dark-500" />
                          </div>
                        </GlassCard>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && !selectedOrder && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-white">سفارش‌های من</h1>

              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                      statusFilter === filter.value
                        ? 'bg-blue-600 text-white'
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
                    <GlassCard
                      key={order._id}
                      hoverable
                      padding="md"
                      onClick={() => setSelectedOrder(order)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-dark-800 rounded-xl flex items-center justify-center">
                            <Car className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">{order.orderNumber}</span>
                              <StatusChip status={order.status} size="sm" />
                            </div>
                            <p className="text-sm text-dark-400">
                              {getVehicleInfo(order)} • {order.issues.slice(0, 2).join('، ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <p className="text-sm text-dark-400">{formatDateSmart(order.createdAt)}</p>
                          <ChevronLeft className="w-5 h-5 text-dark-500" />
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Order Detail */}
          {activeTab === 'orders' && selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 bg-dark-800 rounded-lg text-dark-400 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </button>
                <h1 className="text-2xl font-bold text-white">جزئیات سفارش</h1>
              </div>

              {/* Order Info */}
              <GlassCard padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-white">{selectedOrder.orderNumber}</span>
                  <StatusChip status={selectedOrder.status} />
                </div>

                <div className="space-y-4">
                  {/* Customer */}
                  <div className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                    <User className="w-5 h-5 text-dark-400" />
                    <div className="flex-1">
                      <p className="text-white">{getCustomerInfo(selectedOrder).name}</p>
                      <p className="text-sm text-dark-400" dir="ltr">{getCustomerInfo(selectedOrder).phone}</p>
                    </div>
                    <a
                      href={`tel:${getCustomerInfo(selectedOrder).phone}`}
                      className="p-2 bg-emerald-600/20 rounded-lg text-emerald-400"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>

                  {/* Vehicle */}
                  <div className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                    <Car className="w-5 h-5 text-dark-400" />
                    <div>
                      <p className="text-white">{getVehicleInfo(selectedOrder)}</p>
                      <p className="text-sm text-dark-400">خودرو</p>
                    </div>
                  </div>

                  {/* Location */}
                  {selectedOrder.location && (
                    <div className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                      <MapPin className="w-5 h-5 text-dark-400" />
                      <div className="flex-1">
                        <p className="text-white">{selectedOrder.location.address || 'آدرس ثبت نشده'}</p>
                        <p className="text-sm text-dark-400">آدرس</p>
                      </div>
                    </div>
                  )}

                  {/* Schedule */}
                  {selectedOrder.scheduledDate && (
                    <div className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                      <Calendar className="w-5 h-5 text-dark-400" />
                      <div>
                        <p className="text-white">
                          {formatDateSmart(selectedOrder.scheduledDate)}{selectedOrder.scheduledTime && ` - ${selectedOrder.scheduledTime}`}
                        </p>
                        <p className="text-sm text-dark-400">زمان مراجعه</p>
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  <div>
                    <p className="text-dark-400 text-sm mb-2">مشکلات:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.issues.map((issue, i) => (
                        <span key={i} className="px-3 py-1 bg-dark-800 rounded-full text-sm text-white">
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedOrder.description && (
                    <div>
                      <p className="text-dark-400 text-sm mb-2">توضیحات:</p>
                      <p className="text-white">{selectedOrder.description}</p>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Status Actions */}
              <GlassCard padding="lg">
                <h3 className="font-semibold text-white mb-4">وضعیت سفارش</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === 'planned' && (
                    <Button
                      onClick={() => handleUpdateOrderStatus('in_progress')}
                      isLoading={isUpdatingStatus}
                      className="!bg-blue-600 hover:!bg-blue-500"
                    >
                      <Play className="w-4 h-4 ml-2" />
                      شروع کار
                    </Button>
                  )}
                  {selectedOrder.status === 'in_progress' && (
                    <>
                      <Button
                        onClick={() => handleUpdateOrderStatus('waiting_for_parts')}
                        isLoading={isUpdatingStatus}
                        variant="outline"
                        className="!border-purple-600 !text-purple-400"
                      >
                        <Package className="w-4 h-4 ml-2" />
                        انتظار قطعه
                      </Button>
                      <Button
                        onClick={() => handleUpdateOrderStatus('completed')}
                        isLoading={isUpdatingStatus}
                        className="!bg-emerald-600 hover:!bg-emerald-500"
                      >
                        <CheckCircle className="w-4 h-4 ml-2" />
                        اتمام کار
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'waiting_for_parts' && (
                    <Button
                      onClick={() => handleUpdateOrderStatus('in_progress')}
                      isLoading={isUpdatingStatus}
                      className="!bg-blue-600 hover:!bg-blue-500"
                    >
                      <Play className="w-4 h-4 ml-2" />
                      ادامه کار
                    </Button>
                  )}
                </div>
              </GlassCard>

              {/* Cost Estimation */}
              <GlassCard padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gold-500" />
                    برآورد هزینه
                  </h3>
                  {!showCostForm && (
                    <button
                      onClick={() => setShowCostForm(true)}
                      className="text-blue-400 text-sm"
                    >
                      {selectedOrder.estimatedCostMin ? 'ویرایش' : 'افزودن'}
                    </button>
                  )}
                </div>

                {showCostForm ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        placeholder="حداقل (تومان)"
                        value={costFormData.estimatedCostMin}
                        onChange={(e) => setCostFormData({ ...costFormData, estimatedCostMin: e.target.value })}
                        dir="ltr"
                      />
                      <Input
                        type="number"
                        placeholder="حداکثر (تومان)"
                        value={costFormData.estimatedCostMax}
                        onChange={(e) => setCostFormData({ ...costFormData, estimatedCostMax: e.target.value })}
                        dir="ltr"
                      />
                    </div>
                    <textarea
                      placeholder="توضیحات برآورد..."
                      value={costFormData.notes}
                      onChange={(e) => setCostFormData({ ...costFormData, notes: e.target.value })}
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:border-blue-500 focus:outline-none min-h-[80px] resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitCostEstimate}
                        isLoading={isUpdatingStatus}
                        fullWidth
                      >
                        <Send className="w-4 h-4 ml-2" />
                        ارسال برآورد
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCostForm(false);
                          setCostFormData({ estimatedCostMin: '', estimatedCostMax: '', notes: '' });
                        }}
                      >
                        انصراف
                      </Button>
                    </div>
                  </div>
                ) : selectedOrder.estimatedCostMin ? (
                  <div className="p-4 bg-dark-800/50 rounded-xl">
                    <p className="text-2xl font-bold text-gold-500">
                      {toPersianDigits(selectedOrder.estimatedCostMin.toLocaleString())}
                      {selectedOrder.estimatedCostMax && selectedOrder.estimatedCostMax !== selectedOrder.estimatedCostMin && (
                        <span className="text-dark-400 text-base font-normal">
                          {' '} تا {toPersianDigits(selectedOrder.estimatedCostMax.toLocaleString())}
                        </span>
                      )}
                      <span className="text-sm text-dark-400 font-normal"> تومان</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-dark-400 text-sm">هنوز برآورد هزینه ثبت نشده است.</p>
                )}
              </GlassCard>

              {/* Technician Notes */}
              <GlassCard padding="lg">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  یادداشت‌های تکنسین
                </h3>
                <textarea
                  placeholder="یادداشت‌های خود را اینجا بنویسید..."
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:border-blue-500 focus:outline-none min-h-[100px] resize-none mb-3"
                />
                <Button
                  onClick={handleSaveNotes}
                  isLoading={isUpdatingStatus}
                  variant="outline"
                  className="w-full"
                >
                  <Save className="w-4 h-4 ml-2" />
                  ذخیره یادداشت
                </Button>
              </GlassCard>

              {/* Timeline */}
              <GlassCard padding="lg">
                <h3 className="font-semibold text-white mb-4">مراحل انجام کار</h3>
                <div className="space-y-4">
                  {selectedOrder.timeline.map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => step.status !== 'completed' && handleUpdateTimeline(index)}
                          disabled={step.status === 'completed' || isUpdatingStatus}
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                            step.status === 'completed' ? 'bg-emerald-600' :
                            step.status === 'current' ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer' :
                            'bg-dark-700 hover:bg-dark-600 cursor-pointer'
                          )}
                        >
                          {step.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-xs text-white">{toPersianDigits(index + 1)}</span>
                          )}
                        </button>
                        {index < selectedOrder.timeline.length - 1 && (
                          <div className={cn(
                            'w-0.5 h-8 mt-1',
                            step.status === 'completed' ? 'bg-emerald-600' : 'bg-dark-700'
                          )} />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className={cn(
                          'font-medium',
                          step.status === 'completed' ? 'text-emerald-400' :
                          step.status === 'current' ? 'text-blue-400' :
                          'text-dark-400'
                        )}>
                          {step.title}
                        </p>
                        {step.description && (
                          <p className="text-sm text-dark-400">{step.description}</p>
                        )}
                        {step.status !== 'completed' && (
                          <p className="text-xs text-dark-500 mt-1">کلیک کنید برای تکمیل</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Photos Section */}
              <GlassCard padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-400" />
                    عکس‌ها و مدارک
                  </h3>
                  <button
                    onClick={() => setShowPhotoTypeSelect(true)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن عکس
                  </button>
                </div>

                {/* Photo Grid */}
                {selectedOrder.photos && selectedOrder.photos.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {selectedOrder.photos.map((photo) => (
                      <div key={photo._id} className="relative group aspect-square">
                        <img
                          src={photo.url}
                          alt={PHOTO_TYPE_LABELS[photo.type]}
                          className="w-full h-full object-cover rounded-lg cursor-pointer"
                          onClick={() => setViewingPhoto(photo.url)}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 rounded-b-lg">
                          <span className="text-xs text-white">{PHOTO_TYPE_LABELS[photo.type]}</span>
                        </div>
                        <button
                          onClick={() => handleDeletePhoto(photo._id)}
                          disabled={deletingPhotoId === photo._id}
                          className="absolute top-1 left-1 p-1 bg-red-600/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {deletingPhotoId === photo._id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-white" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Image className="w-12 h-12 mx-auto mb-3 text-dark-600" />
                    <p className="text-dark-400 text-sm">هنوز عکسی اضافه نشده است</p>
                    <button
                      onClick={() => setShowPhotoTypeSelect(true)}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors"
                    >
                      <Camera className="w-4 h-4 inline ml-1" />
                      گرفتن عکس
                    </button>
                  </div>
                )}
              </GlassCard>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-white">پیام‌ها</h1>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Conversations List */}
                <div className="md:col-span-1 space-y-3">
                  {isLoadingChat ? (
                    <div className="flex justify-center py-10">
                      <div className="spinner" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <GlassCard padding="md" className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-dark-600" />
                      <p className="text-dark-400 text-sm">مکالمه‌ای وجود ندارد</p>
                    </GlassCard>
                  ) : (
                    conversations.map((conv) => (
                      <GlassCard
                        key={conv._id}
                        hoverable
                        padding="sm"
                        onClick={() => handleSelectConversation(conv)}
                        className={cn(
                          'cursor-pointer',
                          selectedConversation?._id === conv._id && 'ring-2 ring-blue-600'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-dark-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate">
                              {getOtherParticipant(conv)}
                            </p>
                            <p className="text-xs text-dark-500 truncate">
                              {conv.lastMessage?.text || 'بدون پیام'}
                            </p>
                          </div>
                        </div>
                      </GlassCard>
                    ))
                  )}
                </div>

                {/* Messages View */}
                <div className="md:col-span-2">
                  {selectedConversation ? (
                    <GlassCard padding="none" className="h-[400px] flex flex-col">
                      {/* Header */}
                      <div className="p-4 border-b border-dark-700">
                        <p className="font-semibold text-white">
                          {getOtherParticipant(selectedConversation)}
                        </p>
                        <p className="text-xs text-dark-400">
                          {selectedConversation.type === 'support' ? 'پشتیبانی' : 'مکالمه'}
                        </p>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg) => {
                          const isMe = typeof msg.senderId === 'object'
                            ? msg.senderId?._id === user?.id
                            : msg.senderId === user?.id;
                          return (
                            <div key={msg._id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                              <div className={cn(
                                'max-w-[70%] rounded-lg p-3',
                                isMe ? 'bg-blue-600' : 'bg-dark-800'
                              )}>
                                {!isMe && (
                                  <p className="text-xs text-blue-400 mb-1">{getSenderName(msg)}</p>
                                )}
                                <p className="text-white text-sm">{msg.text}</p>
                                <p className="text-xs text-dark-400 mt-1">
                                  {formatDateSmart(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Message Input */}
                      <div className="p-4 border-t border-dark-700">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                            placeholder="پیام خود را بنویسید..."
                            className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white placeholder-dark-500 focus:border-blue-500 focus:outline-none"
                          />
                          <Button
                            onClick={handleSendMessage}
                            isLoading={isSendingMessage}
                            disabled={!newMessage.trim()}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  ) : (
                    <GlassCard padding="lg" className="h-[400px] flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-dark-600" />
                        <p className="text-dark-400">یک مکالمه را انتخاب کنید</p>
                      </div>
                    </GlassCard>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">تنظیمات</h1>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>ویرایش</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
                  >
                    {isSavingProfile ? (
                      <div className="spinner w-4 h-4" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>ذخیره</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <GlassCard padding="lg">
                <div className="flex flex-col items-center mb-6">
                  {/* Avatar */}
                  <div className="relative mb-4">
                    <div
                      onClick={isEditingProfile ? handleAvatarClick : undefined}
                      className={`w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ${
                        isEditingProfile ? 'cursor-pointer' : ''
                      }`}
                    >
                      {avatarPreview || user?.avatar ? (
                        <img
                          src={avatarPreview || user?.avatar}
                          alt={user?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl text-white font-bold">
                          {user?.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    {isEditingProfile && (
                      <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>

                  {/* Info */}
                  {isEditingProfile ? (
                    <div className="w-full space-y-4">
                      <Input
                        placeholder="نام و نام خانوادگی"
                        value={profileFormData.name}
                        onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                        icon={<User className="w-5 h-5" />}
                      />
                      <Input
                        placeholder="ایمیل (اختیاری)"
                        type="email"
                        value={profileFormData.email}
                        onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                        icon={<Mail className="w-5 h-5" />}
                        dir="ltr"
                      />
                      <div className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                        <Phone className="w-5 h-5 text-dark-400" />
                        <span className="text-dark-400" dir="ltr">{user?.phone}</span>
                        <span className="text-xs text-dark-500">(غیرقابل تغییر)</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleSaveProfile}
                          isLoading={isSavingProfile}
                          fullWidth
                        >
                          ذخیره تغییرات
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          انصراف
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <h2 className="text-xl font-bold text-white mb-1">{user?.name}</h2>
                      <p className="text-dark-400" dir="ltr">{user?.phone}</p>
                      {user?.email && (
                        <p className="text-dark-400 text-sm mt-1">{user.email}</p>
                      )}
                      <span className="inline-block mt-2 px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full">
                        تکنسین
                      </span>
                    </div>
                  )}
                </div>

                <hr className="border-dark-700 my-6" />

                <button
                  onClick={handleLogout}
                  className="w-full py-3 text-center text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  خروج از حساب کاربری
                </button>
              </GlassCard>
            </div>
          )}
        </div>
      </main>

      {/* Photo Type Selection Modal */}
      {showPhotoTypeSelect && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70">
          <div className="bg-dark-900 rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h3 className="font-semibold text-white">انتخاب نوع عکس</h3>
              <button onClick={() => setShowPhotoTypeSelect(false)} className="p-1 text-dark-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {(Object.keys(PHOTO_TYPE_LABELS) as PhotoType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleOpenCamera(type)}
                  className="flex flex-col items-center gap-2 p-4 bg-dark-800 rounded-xl hover:bg-dark-700 transition-colors"
                >
                  {type === 'vehicle' && <Car className="w-8 h-8 text-blue-400" />}
                  {type === 'license_plate' && <FileText className="w-8 h-8 text-amber-400" />}
                  {type === 'vin' && <FileText className="w-8 h-8 text-purple-400" />}
                  {type === 'invoice' && <FileText className="w-8 h-8 text-emerald-400" />}
                  {type === 'document' && <FileText className="w-8 h-8 text-pink-400" />}
                  {type === 'other' && <Image className="w-8 h-8 text-dark-400" />}
                  <span className="text-sm text-white">{PHOTO_TYPE_LABELS[type]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onCancel={() => setShowCamera(false)}
          isUploading={isUploadingPhoto}
        />
      )}

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setViewingPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white bg-dark-800/50 rounded-full"
            onClick={() => setViewingPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={viewingPhoto}
            alt="Full view"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
