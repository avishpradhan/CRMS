import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleDarkMode, toggleSidebar } from '../../store/slices/themeSlice';
import { fetchNotifications } from '../../store/slices/dataSlice';
import NotificationPanel from '../shared/NotificationPanel';
import { Bell, Sun, Moon, Menu, Search, User } from 'lucide-react';

export default function Navbar() {
  const dispatch = useDispatch();
  const { user, role } = useSelector(state => state.auth);
  const { darkMode } = useSelector(state => state.theme);
  const { notifications } = useSelector(state => state.data);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = (notifications || []).filter(n => n.forRole === role && !n.read).length;

  useEffect(() => {
    if (!user) return;
    dispatch(fetchNotifications());

    const interval = setInterval(() => {
      dispatch(fetchNotifications());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch, user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: hamburger + search */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <Menu size={20} className="text-surface-600 dark:text-surface-400" />
          </button>

          <div className={`relative transition-all duration-300 ${searchOpen ? 'w-64' : 'w-0 lg:w-64'} overflow-hidden`}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search..."
              className="input-field pl-9 !bg-surface-50 dark:!bg-surface-800 !rounded-xl !border-surface-100 dark:!border-surface-700"
            />
          </div>
          <button
            onClick={() => setSearchOpen(s => !s)}
            className="lg:hidden p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <Search size={20} className="text-surface-600 dark:text-surface-400" />
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(toggleDarkMode())}
            className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-surface-500" />}
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(o => !o)}
              className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors relative"
            >
              <Bell size={18} className="text-surface-500 dark:text-surface-400" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[9px] font-bold bg-danger-500 text-white rounded-full flex items-center justify-center z-10">
                    {unreadCount}
                  </span>
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger-500 rounded-full animate-ping opacity-75" />
                </>
              )}
            </button>
            <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>

          <div className="h-8 w-px bg-surface-200 dark:bg-surface-700 mx-1" />

          <div className="flex items-center gap-3 pl-2">
            <div className="w-9 h-9 rounded-full gradient-accent flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-surface-900 dark:text-white leading-tight">{user?.name}</p>
              <p className="text-[11px] text-surface-400 capitalize">{role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
