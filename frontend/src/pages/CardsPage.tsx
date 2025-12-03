import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BottomNav } from '../components/layout/BottomNav';
import { toPersianDigits, toEnglishDigits } from '../utils/helpers';

interface BankCard {
  id: string;
  cardNumber: string;
  holderName: string;
  bankName: string;
  isDefault: boolean;
}

// Format card number with spaces
const formatCardNumber = (value: string): string => {
  const digits = toEnglishDigits(value).replace(/\D/g, '');
  const groups = digits.match(/.{1,4}/g) || [];
  return groups.join(' ');
};

// Get bank name from card number prefix
const getBankNameFromPrefix = (cardNumber: string): string => {
  const digits = toEnglishDigits(cardNumber).replace(/\D/g, '');
  const prefix = digits.substring(0, 6);

  const banks: { [key: string]: string } = {
    '603799': 'ملی',
    '589210': 'سپه',
    '627648': 'توسعه صادرات',
    '627961': 'صنعت و معدن',
    '603770': 'کشاورزی',
    '628023': 'مسکن',
    '627760': 'پست بانک',
    '502908': 'توسعه تعاون',
    '627412': 'اقتصاد نوین',
    '622106': 'پارسیان',
    '502229': 'پاسارگاد',
    '627488': 'کارآفرین',
    '621986': 'سامان',
    '639346': 'سینا',
    '639607': 'سرمایه',
    '502806': 'شهر',
    '502938': 'دی',
    '603769': 'صادرات',
    '610433': 'ملت',
    '627353': 'تجارت',
    '589463': 'رفاه',
    '627381': 'انصار',
    '639370': 'مهر اقتصاد',
    '505785': 'ایران زمین',
    '636214': 'آینده',
    '636949': 'حکمت ایرانیان',
    '505416': 'گردشگری',
    '636795': 'مرکزی',
    '628157': 'موسسه اعتباری توسعه',
    '505801': 'موسسه اعتباری کوثر',
  };

  for (const [key, value] of Object.entries(banks)) {
    if (prefix.startsWith(key)) {
      return `بانک ${value}`;
    }
  }

  return '';
};

export function CardsPage() {
  const [cards, setCards] = useState<BankCard[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cardNumber: '',
    holderName: '',
    bankName: '',
  });

  // Load cards from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('userBankCards');
    if (saved) {
      setCards(JSON.parse(saved));
    }
  }, []);

  // Save cards to localStorage
  const saveCards = (newCards: BankCard[]) => {
    localStorage.setItem('userBankCards', JSON.stringify(newCards));
    setCards(newCards);
  };

  const handleCardNumberChange = (value: string) => {
    const digits = toEnglishDigits(value).replace(/\D/g, '').substring(0, 16);
    const formatted = formatCardNumber(digits);
    const bankName = getBankNameFromPrefix(digits);
    setFormData({
      ...formData,
      cardNumber: formatted,
      bankName: bankName || formData.bankName,
    });
  };

  const handleAdd = () => {
    const digits = toEnglishDigits(formData.cardNumber).replace(/\D/g, '');
    if (digits.length !== 16 || !formData.holderName) {
      return;
    }

    const newCard: BankCard = {
      id: Date.now().toString(),
      cardNumber: digits,
      holderName: formData.holderName,
      bankName: formData.bankName || 'نامشخص',
      isDefault: cards.length === 0,
    };

    saveCards([...cards, newCard]);
    setFormData({ cardNumber: '', holderName: '', bankName: '' });
    setIsAdding(false);
  };

  const handleEdit = (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (card) {
      setFormData({
        cardNumber: formatCardNumber(card.cardNumber),
        holderName: card.holderName,
        bankName: card.bankName,
      });
      setEditingId(id);
    }
  };

  const handleUpdate = () => {
    const digits = toEnglishDigits(formData.cardNumber).replace(/\D/g, '');
    if (digits.length !== 16 || !formData.holderName || !editingId) {
      return;
    }

    const updated = cards.map((c) =>
      c.id === editingId
        ? {
            ...c,
            cardNumber: digits,
            holderName: formData.holderName,
            bankName: formData.bankName || 'نامشخص',
          }
        : c
    );
    saveCards(updated);
    setFormData({ cardNumber: '', holderName: '', bankName: '' });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('آیا از حذف این کارت مطمئن هستید؟')) {
      const filtered = cards.filter((c) => c.id !== id);
      // If we deleted the default, make the first one default
      if (filtered.length > 0 && !filtered.some((c) => c.isDefault)) {
        filtered[0].isDefault = true;
      }
      saveCards(filtered);
    }
  };

  const handleSetDefault = (id: string) => {
    const updated = cards.map((c) => ({
      ...c,
      isDefault: c.id === id,
    }));
    saveCards(updated);
  };

  const maskCardNumber = (cardNumber: string): string => {
    const digits = toEnglishDigits(cardNumber).replace(/\D/g, '');
    if (digits.length !== 16) return cardNumber;
    return `${digits.slice(0, 4)} **** **** ${digits.slice(12)}`;
  };

  return (
    <div className="min-h-screen bg-dark-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
          <Link to="/settings" className="p-2 -mr-2 text-dark-400 hover:text-white">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center font-semibold text-white">کارت‌های بانکی</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <GlassCard padding="md">
            <h3 className="font-semibold text-white mb-4">
              {editingId ? 'ویرایش کارت' : 'افزودن کارت جدید'}
            </h3>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="شماره کارت"
                  value={formData.cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  icon={<CreditCard className="w-5 h-5" />}
                  dir="ltr"
                  className="text-center tracking-widest"
                  maxLength={19}
                />
                {formData.bankName && (
                  <p className="text-sm text-gold-500 mt-1 text-center">
                    {formData.bankName}
                  </p>
                )}
              </div>
              <Input
                placeholder="نام صاحب کارت"
                value={formData.holderName}
                onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
              />
              <div className="flex gap-2">
                <Button
                  onClick={editingId ? handleUpdate : handleAdd}
                  fullWidth
                  disabled={
                    toEnglishDigits(formData.cardNumber).replace(/\D/g, '').length !== 16 ||
                    !formData.holderName
                  }
                >
                  {editingId ? 'به‌روزرسانی' : 'افزودن'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setFormData({ cardNumber: '', holderName: '', bankName: '' });
                  }}
                >
                  انصراف
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Card List */}
        {cards.length === 0 && !isAdding ? (
          <GlassCard padding="lg" className="text-center">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-dark-500" />
            <p className="text-dark-400 mb-4">هنوز کارتی ثبت نکرده‌اید</p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-5 h-5 ml-2" />
              افزودن کارت
            </Button>
          </GlassCard>
        ) : (
          <>
            {cards.map((card) => (
              <GlassCard key={card.id} padding="md">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{card.bankName}</h3>
                      {card.isDefault && (
                        <span className="text-xs bg-gold-600/20 text-gold-500 px-2 py-0.5 rounded-full">
                          پیش‌فرض
                        </span>
                      )}
                    </div>
                    <p className="text-dark-300 font-mono text-sm" dir="ltr">
                      {toPersianDigits(maskCardNumber(card.cardNumber))}
                    </p>
                    <p className="text-dark-500 text-sm mt-1">{card.holderName}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!card.isDefault && (
                      <button
                        onClick={() => handleSetDefault(card.id)}
                        className="p-2 text-dark-400 hover:text-gold-500 transition-colors"
                        title="انتخاب به عنوان پیش‌فرض"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(card.id)}
                      className="p-2 text-dark-400 hover:text-blue-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="p-2 text-dark-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}

            {/* Add Button */}
            {!isAdding && !editingId && (
              <Button onClick={() => setIsAdding(true)} fullWidth variant="outline">
                <Plus className="w-5 h-5 ml-2" />
                افزودن کارت جدید
              </Button>
            )}
          </>
        )}

        {/* Info Note */}
        <div className="text-center text-dark-500 text-sm p-4">
          <p>اطلاعات کارت‌های بانکی شما به صورت امن در دستگاه شما ذخیره می‌شود.</p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
