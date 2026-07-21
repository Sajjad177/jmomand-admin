import { Bell } from 'lucide-react';
import { formatDate } from '../../lib/helper';
import { NotificationItemType } from './notification';

export function NotificationItem({ notification }: { notification: NotificationItemType }) {
  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <span
        className={`mt-2 h-2.5 w-2.5 rounded-full ${notification?.isViewed ? 'bg-slate-200' : 'bg-[#FF5A1F]'}`}
      />
      <Bell className="mt-0.5 h-4 w-4 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">
          {notification?.message || 'Notification'}
        </p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
          <span className="capitalize">{notification?.type || 'general'}</span>
          <span>{formatDate(notification?.createdAt, true)}</span>
        </div>
      </div>
    </div>
  );
}
