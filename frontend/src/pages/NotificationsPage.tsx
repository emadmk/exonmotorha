import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Car,
  MessageCircle,
  CheckCircle,
  Trash2,
  Check,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { BottomNav } from '../components/layout/BottomNav';
import { notificationAPI } from '../services/api';
import { cn, formatDateSmart } from '../utils/helpers';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'order_update' | 'message' | 'payment' | 'system';
  relatedOrderId?: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(notifications.map(n =>
        n._id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_update':
        return <Car className="w-5 h-5 text-gold-500" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-emerald-400" />;
      case 'payment':
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-dark-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-dark-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
          <Link to="/dashboard" className="p-2 -mr-2 text-dark-400 hover:text-white">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center font-semibold text-white">اعلان‌ها</h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-gold-500 text-sm"
            >
              خواندن همه
            </button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <GlassCard padding="lg" className="text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-dark-600" />
            <p className="text-dark-400">اعلانی ندارید</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <GlassCard
                key={notif._id}
                padding="md"
                className={cn(!notif.isRead && 'border-gold-600/30')}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('font-medium', notif.isRead ? 'text-dark-300' : 'text-white')}>
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 bg-gold-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-dark-400">{notif.message}</p>
                    <p className="text-xs text-dark-500 mt-1">{formatDateSmart(notif.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="p-2 text-dark-500 hover:text-emerald-400"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif._id)}
                      className="p-2 text-dark-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
