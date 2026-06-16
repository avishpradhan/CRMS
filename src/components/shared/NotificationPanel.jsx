import { useSelector, useDispatch } from 'react-redux';
import {
  markNotificationReadThunk,
  markAllNotificationsReadThunk,
  deleteNotificationThunk,
} from '../../store/slices/dataSlice';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle, X, Trash2 } from 'lucide-react';

export default function NotificationPanel({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { role } = useSelector(state => state.auth);
  const { notifications } = useSelector(state => state.data);

  const roleNotifications = notifications.filter(n => n.forRole === role);
  const unread = roleNotifications.filter(n => !n.read).length;

  const iconMap = {
    info: <Info size={16} className="text-blue-500" />,
    success: <CheckCircle size={16} className="text-emerald-500" />,
    warning: <AlertTriangle size={16} className="text-amber-500" />,
    danger: <XCircle size={16} className="text-red-500" />,
  };

  const formatTime = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = (now - date) / 1000 / 60;
    if (diff < 60) return `${Math.floor(diff)}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 z-50 animate-scale-in overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary-500" />
          <h3 className="font-bold text-surface-900 dark:text-white">Notifications</h3>
          {unread > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-primary-500 text-white rounded-full">{unread}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={() => dispatch(markAllNotificationsReadThunk())}
              className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700">
            <X size={16} className="text-surface-400" />
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {roleNotifications.length === 0 ? (
          <div className="p-8 text-center text-surface-400">No notifications</div>
        ) : (
          roleNotifications.map(n => (
            <div
              key={n.id}
              className={`group flex gap-3 p-4 border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30 cursor-pointer transition-colors relative items-start ${!n.read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
              onClick={() => dispatch(markNotificationReadThunk(n.id))}
            >
              <div className="mt-0.5">{iconMap[n.type]}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${!n.read ? 'text-surface-900 dark:text-white' : 'text-surface-600 dark:text-surface-400'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-surface-400 mt-1">{formatTime(n.timestamp)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!n.read && <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 shrink-0" />}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(deleteNotificationThunk(n.id));
                  }}
                  className="p-1 rounded hover:bg-danger-50 dark:hover:bg-danger-950/20 text-surface-400 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
