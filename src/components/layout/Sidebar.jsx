import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar } from '../../store/slices/themeSlice';
import {
  LayoutDashboard, User, Briefcase, FileText, Calendar, BarChart3, Bell, Settings,
  Building2, PlusCircle, FolderOpen, Users, UserCheck, ClipboardList, LogOut,
  GraduationCap, ChevronLeft, ChevronRight, Shield, Layers
} from 'lucide-react';

const menuConfig = {
  student: [
    { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/student/profile', label: 'Profile', icon: User },
    { path: '/student/drives', label: 'Available Drives', icon: Briefcase },
    { path: '/student/applications', label: 'My Applications', icon: FileText },
    { path: '/student/notifications', label: 'Notifications', icon: Bell },
    { path: '/student/settings', label: 'Settings', icon: Settings },
  ],
  recruiter: [
    { path: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/recruiter/profile', label: 'Company Profile', icon: Building2 },
    { path: '/recruiter/post-drive', label: 'Post New Drive', icon: PlusCircle },
    { path: '/recruiter/drives', label: 'Manage Drives', icon: FolderOpen },
    { path: '/recruiter/applicants', label: 'Applicants & Pipelines', icon: Users },
    { path: '/recruiter/shortlisted', label: 'Shortlisted', icon: UserCheck },
    { path: '/recruiter/notifications', label: 'Notifications', icon: Bell },
  ],
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/students', label: 'Students', icon: GraduationCap },
    { path: '/admin/recruiters', label: 'Recruiters', icon: Building2 },
    { path: '/admin/drives', label: 'Campus Drives', icon: Briefcase },
    { path: '/admin/batches', label: 'Batches', icon: Layers },
    { path: '/admin/statistics', label: 'Placement Statistics', icon: BarChart3 },
    { path: '/admin/notifications', label: 'Notifications', icon: Bell },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ],
};

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role } = useSelector(state => state.auth);
  const { sidebarCollapsed } = useSelector(state => state.theme);

  const menu = menuConfig[role] || [];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const roleIcons = { student: GraduationCap, recruiter: Building2, admin: Shield };
  const RoleIcon = roleIcons[role] || Shield;

  return (
    <aside className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-[72px]' : 'w-64'} bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-200 dark:border-surface-800 shrink-0">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          <RoleIcon size={18} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="animate-fade-in overflow-hidden">
            <h1 className="text-sm font-bold text-surface-900 dark:text-white leading-tight">CRMS</h1>
            <p className="text-[10px] text-surface-400 capitalize">{role} Portal</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        <div className="space-y-0.5">
          {menu.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.8125rem] font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-white'
                }`
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon size={19} className="shrink-0" />
              {!sidebarCollapsed && <span className="animate-fade-in truncate">{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Collapse toggle + Logout */}
      <div className="px-2.5 py-3 border-t border-surface-200 dark:border-surface-800 space-y-1 shrink-0">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[0.8125rem] font-medium text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[0.8125rem] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut size={19} />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
