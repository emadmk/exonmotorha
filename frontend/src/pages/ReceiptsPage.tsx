import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  Download,
  CreditCard,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { BottomNav } from '../components/layout/BottomNav';
import { receiptAPI } from '../services/api';
import { cn, formatCurrency, formatDateSmart, toPersianDigits } from '../utils/helpers';

interface ReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReceiptData {
  _id: string;
  receiptNumber: string;
  orderId: {
    _id: string;
    orderNumber: string;
  };
  items: ReceiptItem[];
  laborCost: number;
  partsCost: number;
  discount: number;
  tax: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
}

export function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    setIsLoading(true);
    try {
      const response = await receiptAPI.getAll();
      setReceipts(response.data.receipts || []);
    } catch (error) {
      console.error('Error loading receipts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (receiptId: string) => {
    setIsPaying(true);
    try {
      const response = await receiptAPI.initPayment(receiptId);
      if (response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
    } finally {
      setIsPaying(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'paid':
        return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-600/20', label: 'پرداخت شده' };
      case 'pending':
        return { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-600/20', label: 'در انتظار پرداخت' };
      case 'cancelled':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-600/20', label: 'لغو شده' };
      default:
        return { icon: Receipt, color: 'text-dark-400', bg: 'bg-dark-800', label: status };
    }
  };

  // Receipt Detail View
  if (selectedReceipt) {
    const statusInfo = getStatusInfo(selectedReceipt.status);
    const StatusIcon = statusInfo.icon;

    return (
      <div className="min-h-screen bg-dark-950 pb-24">
        <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
          <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="p-2 -mr-2 text-dark-400 hover:text-white"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
            <h1 className="flex-1 text-center font-semibold text-white">
              رسید {selectedReceipt.receiptNumber}
            </h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
          {/* Status */}
          <GlassCard padding="md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', statusInfo.bg)}>
                  <StatusIcon className={cn('w-5 h-5', statusInfo.color)} />
                </div>
                <div>
                  <p className="font-medium text-white">{statusInfo.label}</p>
                  <p className="text-sm text-dark-400">
                    سفارش: {selectedReceipt.orderId.orderNumber}
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-white">
                {formatCurrency(selectedReceipt.totalAmount)}
              </p>
            </div>
          </GlassCard>

          {/* Items */}
          <GlassCard padding="md">
            <h3 className="font-semibold text-white mb-4">جزئیات</h3>
            <div className="space-y-3">
              {selectedReceipt.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-dark-300">
                    {item.description} × {toPersianDigits(item.quantity)}
                  </span>
                  <span className="text-white">{formatCurrency(item.total)}</span>
                </div>
              ))}

              <hr className="border-dark-700" />

              <div className="flex justify-between text-sm">
                <span className="text-dark-400">هزینه قطعات</span>
                <span className="text-white">{formatCurrency(selectedReceipt.partsCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">دستمزد</span>
                <span className="text-white">{formatCurrency(selectedReceipt.laborCost)}</span>
              </div>

              {selectedReceipt.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">تخفیف</span>
                  <span className="text-emerald-400">-{formatCurrency(selectedReceipt.discount)}</span>
                </div>
              )}

              {selectedReceipt.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">مالیات</span>
                  <span className="text-white">{formatCurrency(selectedReceipt.tax)}</span>
                </div>
              )}

              <hr className="border-dark-700" />

              <div className="flex justify-between">
                <span className="font-semibold text-white">جمع کل</span>
                <span className="font-bold text-gold-500">{formatCurrency(selectedReceipt.totalAmount)}</span>
              </div>
            </div>
          </GlassCard>

          {/* Payment Button */}
          {selectedReceipt.status === 'pending' && (
            <Button
              onClick={() => handlePayment(selectedReceipt._id)}
              isLoading={isPaying}
              fullWidth
            >
              <CreditCard className="w-5 h-5 ml-2" />
              پرداخت آنلاین
            </Button>
          )}

          {selectedReceipt.status === 'paid' && selectedReceipt.paidAt && (
            <GlassCard padding="sm" className="text-center">
              <p className="text-sm text-dark-400">
                پرداخت شده در {formatDateSmart(selectedReceipt.paidAt)}
              </p>
            </GlassCard>
          )}
        </main>

        <BottomNav />
      </div>
    );
  }

  // Receipts List View
  return (
    <div className="min-h-screen bg-dark-950 pb-24">
      <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
          <Link to="/dashboard" className="p-2 -mr-2 text-dark-400 hover:text-white">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center font-semibold text-white">رسیدها</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : receipts.length === 0 ? (
          <GlassCard padding="lg" className="text-center">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-dark-600" />
            <p className="text-dark-400">رسیدی ندارید</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {receipts.map((receipt) => {
              const statusInfo = getStatusInfo(receipt.status);
              const StatusIcon = statusInfo.icon;

              return (
                <GlassCard
                  key={receipt._id}
                  hoverable
                  padding="md"
                  onClick={() => setSelectedReceipt(receipt)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', statusInfo.bg)}>
                        <StatusIcon className={cn('w-6 h-6', statusInfo.color)} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{receipt.receiptNumber}</p>
                        <p className="text-sm text-dark-400">
                          {receipt.orderId.orderNumber}
                        </p>
                        <p className="text-xs text-dark-500 mt-1">
                          {formatDateSmart(receipt.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white">{formatCurrency(receipt.totalAmount)}</p>
                      <p className={cn('text-xs', statusInfo.color)}>{statusInfo.label}</p>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
