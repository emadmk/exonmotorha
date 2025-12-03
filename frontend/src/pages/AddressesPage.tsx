import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  MapPin,
  Plus,
  Trash2,
  Home,
  Briefcase,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BottomNav } from '../components/layout/BottomNav';

interface Address {
  id: string;
  title: string;
  address: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
}

export function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    address: string;
    type: 'home' | 'work' | 'other';
  }>({
    title: '',
    address: '',
    type: 'home',
  });

  // Load addresses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('userAddresses');
    if (saved) {
      setAddresses(JSON.parse(saved));
    }
  }, []);

  // Save addresses to localStorage
  const saveAddresses = (newAddresses: Address[]) => {
    localStorage.setItem('userAddresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  };

  const handleAdd = () => {
    if (!formData.title || !formData.address) return;

    const newAddress: Address = {
      id: Date.now().toString(),
      title: formData.title,
      address: formData.address,
      type: formData.type,
      isDefault: addresses.length === 0,
    };

    saveAddresses([...addresses, newAddress]);
    setFormData({ title: '', address: '', type: 'home' });
    setIsAdding(false);
  };

  const handleEdit = (id: string) => {
    const address = addresses.find((a) => a.id === id);
    if (address) {
      setFormData({
        title: address.title,
        address: address.address,
        type: address.type,
      });
      setEditingId(id);
    }
  };

  const handleUpdate = () => {
    if (!formData.title || !formData.address || !editingId) return;

    const updated = addresses.map((a) =>
      a.id === editingId
        ? { ...a, title: formData.title, address: formData.address, type: formData.type }
        : a
    );
    saveAddresses(updated);
    setFormData({ title: '', address: '', type: 'home' });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('آیا از حذف این آدرس مطمئن هستید؟')) {
      const filtered = addresses.filter((a) => a.id !== id);
      // If we deleted the default, make the first one default
      if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
        filtered[0].isDefault = true;
      }
      saveAddresses(filtered);
    }
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    saveAddresses(updated);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'home':
        return Home;
      case 'work':
        return Briefcase;
      default:
        return MapPin;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'home':
        return 'منزل';
      case 'work':
        return 'محل کار';
      default:
        return 'سایر';
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
          <Link to="/settings" className="p-2 -mr-2 text-dark-400 hover:text-white">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center font-semibold text-white">آدرس‌های من</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <GlassCard padding="md">
            <h3 className="font-semibold text-white mb-4">
              {editingId ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
            </h3>
            <div className="space-y-4">
              <Input
                placeholder="عنوان آدرس (مثلاً: منزل)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                icon={<MapPin className="w-5 h-5" />}
              />
              <textarea
                placeholder="آدرس کامل"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:border-gold-500 focus:outline-none min-h-[100px] resize-none"
              />
              <div className="flex gap-2">
                {(['home', 'work', 'other'] as const).map((type) => {
                  const Icon = getTypeIcon(type);
                  return (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, type })}
                      className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                        formData.type === type
                          ? 'bg-gold-600/20 border-gold-600 text-gold-500'
                          : 'bg-dark-800 border-dark-600 text-dark-400 hover:border-dark-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{getTypeLabel(type)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={editingId ? handleUpdate : handleAdd}
                  fullWidth
                >
                  {editingId ? 'به‌روزرسانی' : 'افزودن'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setFormData({ title: '', address: '', type: 'home' });
                  }}
                >
                  انصراف
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Address List */}
        {addresses.length === 0 && !isAdding ? (
          <GlassCard padding="lg" className="text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-dark-500" />
            <p className="text-dark-400 mb-4">هنوز آدرسی ثبت نکرده‌اید</p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-5 h-5 ml-2" />
              افزودن آدرس
            </Button>
          </GlassCard>
        ) : (
          <>
            {addresses.map((address) => {
              const Icon = getTypeIcon(address.type);
              return (
                <GlassCard key={address.id} padding="md">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-gold-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{address.title}</h3>
                        {address.isDefault && (
                          <span className="text-xs bg-gold-600/20 text-gold-500 px-2 py-0.5 rounded-full">
                            پیش‌فرض
                          </span>
                        )}
                      </div>
                      <p className="text-dark-400 text-sm">{address.address}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          className="p-2 text-dark-400 hover:text-gold-500 transition-colors"
                          title="انتخاب به عنوان پیش‌فرض"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(address.id)}
                        className="p-2 text-dark-400 hover:text-blue-400 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="p-2 text-dark-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}

            {/* Add Button */}
            {!isAdding && !editingId && (
              <Button onClick={() => setIsAdding(true)} fullWidth variant="outline">
                <Plus className="w-5 h-5 ml-2" />
                افزودن آدرس جدید
              </Button>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
