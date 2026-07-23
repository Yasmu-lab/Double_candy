import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  ChefHat,
  Package,
  PackageCheck,
  PackagePlus,
  ShoppingBag,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useNotificationStore, useUnreadNotificationCount } from '../../store/notificationStore';
import { formatRelativeDate } from '../../lib/format';
import type { NotificationDto, NotificationType } from '../../lib/api';
import { Skeleton } from '../ui/Skeleton';

const TYPE_ICON: Record<NotificationType, ReactNode> = {
  order_received: <ShoppingBag size={15} strokeWidth={2} className="shrink-0 text-purple" />,
  order_confirmed: <Check size={15} strokeWidth={2} className="shrink-0 text-orange" />,
  order_preparing: <ChefHat size={15} strokeWidth={2} className="shrink-0 text-orange" />,
  order_separated: <PackageCheck size={15} strokeWidth={2} className="shrink-0 text-pink" />,
  order_ready: <Package size={15} strokeWidth={2} className="shrink-0 text-lime" />,
  order_delivered: <CheckCheck size={15} strokeWidth={2} className="shrink-0 text-lime" />,
  order_no_show: <AlertTriangle size={15} strokeWidth={2} className="shrink-0 text-orange" />,
  order_cancelled: <XCircle size={15} strokeWidth={2} className="shrink-0 text-red" />,
  new_order: <ShoppingBag size={15} strokeWidth={2} className="shrink-0 text-pink" />,
  out_of_stock: <AlertTriangle size={15} strokeWidth={2} className="shrink-0 text-red" />,
  low_stock: <AlertTriangle size={15} strokeWidth={2} className="shrink-0 text-orange" />,
  new_customer: <UserPlus size={15} strokeWidth={2} className="shrink-0 text-lime" />,
  new_product: <PackagePlus size={15} strokeWidth={2} className="shrink-0 text-purple" />,
};

export function NotificationBell() {
  const navigate = useNavigate();
  const notifications = useNotificationStore((s) => s.notifications);
  const loading = useNotificationStore((s) => s.loading);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const remove = useNotificationStore((s) => s.remove);
  const unreadCount = useUnreadNotificationCount();
  const setOpenOrderId = useAdminStore((s) => s.setOpenOrderId);
  const openProdModal = useAdminStore((s) => s.openProdModal);
  const [open, setOpen] = useState(false);

  const handleClick = (n: NotificationDto) => {
    if (!n.isRead) markRead(n.id);
    setOpen(false);
    if (!n.link) return;
    if (n.link === '/admin/orders' && n.relatedId) setOpenOrderId(n.relatedId);
    if (n.link === '/admin/products' && n.relatedId) openProdModal(n.relatedId);
    navigate(n.link);
  };

  return (
    <div
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      className="relative shrink-0"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notificações (${unreadCount} não lidas)` : 'Notificações'}
        className="relative flex h-[46px] w-[46px] shrink-0 cursor-pointer items-center justify-center rounded-sm border border-white/[0.06] bg-surface text-text outline-none transition-colors hover:bg-card-2 focus-visible:ring-2 focus-visible:ring-pink-light"
      >
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute right-2.5 top-2 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-surface bg-pink px-[3px] text-[9px] font-extrabold text-text">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="dc-scroll absolute right-0 top-[54px] z-30 max-h-[420px] w-[320px] max-w-[92vw] overflow-y-auto rounded-md border border-white/[0.08] bg-surface shadow-[0_24px_50px_-16px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2.5">
            <span className="text-[13px] font-bold">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="cursor-pointer text-[11.5px] font-semibold text-pink hover:text-pink-dark"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {loading && notifications.length === 0 && (
            <div className="p-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2.5 px-2.5 py-2.5">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="mb-1.5 h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="px-3 py-8 text-center text-[13px] text-text-2">Nenhuma notificação por aqui.</div>
          )}

          {notifications.map((n) => (
            <div
              key={n.id}
              className={[
                'group relative flex cursor-pointer items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-card-2',
                !n.isRead ? 'bg-pink/[0.05]' : '',
              ].join(' ')}
              onClick={() => handleClick(n)}
              tabIndex={-1}
            >
              {!n.isRead && <span className="absolute left-1.5 top-4 h-1.5 w-1.5 rounded-full bg-pink" />}
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card">
                {TYPE_ICON[n.type]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold">{n.title}</div>
                <div className="mt-0.5 line-clamp-2 text-[12px] text-text-2">{n.message}</div>
                <div className="mt-1 text-[11px] text-text-3">{formatRelativeDate(n.createdAt)}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(n.id);
                }}
                title="Excluir"
                aria-label="Excluir notificação"
                className="mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-xs text-text-3 opacity-0 outline-none transition-all hover:bg-red/10 hover:text-red group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-pink-light"
              >
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
