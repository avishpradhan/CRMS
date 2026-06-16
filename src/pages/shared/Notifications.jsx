import { useSelector, useDispatch } from 'react-redux';
import {
  markNotificationReadThunk,
  markAllNotificationsReadThunk,
  deleteNotificationThunk,
  clearAllNotificationsThunk,
} from '../../store/slices/dataSlice';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle, Trash2 } from 'lucide-react';

export default function Notifications() {
  const dispatch = useDispatch();
  const { role } = useSelector(state => state.auth);
  const { notifications } = useSelector(state => state.data);

  const roleNotifs = notifications.filter(n => n.forRole === role);
  const unread = roleNotifs.filter(n => !n.read).length;

  const iconMap = {
    info: <Info size={20} className="text-blue-500" />,
    success: <CheckCircle size={20} className="text-emerald-500" />,
    warning: <AlertTriangle size={20} className="text-amber-500" />,
    danger: <XCircle size={20} className="text-red-500" />,
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Notifications</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">{unread} unread notifications</p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={() => dispatch(markAllNotificationsReadThunk())} className="btn-secondary">
              <CheckCheck size={16} /> Mark All Read
            </button>
          )}
          {roleNotifs.length > 0 && (
            <button
              onClick={() => dispatch(clearAllNotificationsThunk(role))}
              className="px-3 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={16} /> Clear All
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {roleNotifs.map(n => (
          <div
            key={n.id}
            onClick={() => dispatch(markNotificationReadThunk(n.id))}
            className={`group glass-card p-4 flex gap-4 cursor-pointer transition-all relative items-start ${!n.read ? 'border-l-4 border-primary-500 bg-primary-50/30 dark:bg-primary-900/5' : ''}`}
          >
            <div className="mt-0.5">{iconMap[n.type]}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${!n.read ? 'text-surface-900 dark:text-white' : 'text-surface-600 dark:text-surface-400'}`}>
                {n.title}
              </p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{n.message}</p>
              <p className="text-xs text-surface-400 mt-1">{formatTime(n.timestamp)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!n.read && <div className="w-2.5 h-2.5 bg-primary-500 rounded-full mt-1.5 shrink-0" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(deleteNotificationThunk(n.id));
                }}
                className="p-1.5 rounded-lg text-surface-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/20 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete notification"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {roleNotifs.length === 0 && (
        <div className="text-center py-16 text-surface-400 glass-card">
          <Bell size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No notifications</p>
        </div>
      )}
    </div>
  );
}
