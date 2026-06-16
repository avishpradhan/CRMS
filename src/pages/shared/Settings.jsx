import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleDarkMode } from '../../store/slices/themeSlice';
import { Moon, Sun, Bell, Shield, Eye, Save } from 'lucide-react';

export default function Settings() {
  const dispatch = useDispatch();
  const { darkMode } = useSelector(state => state.theme);
  const { user } = useSelector(state => state.auth);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [profilePublic, setProfilePublic] = useState(false);

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Settings</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Manage your preferences</p>
      </div>

      {/* Appearance */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          {darkMode ? <Moon size={18} className="text-primary-500" /> : <Sun size={18} className="text-primary-500" />}
          Appearance
        </h3>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-white">Dark Mode</p>
            <p className="text-xs text-surface-400 mt-0.5">Switch between light and dark theme</p>
          </div>
          <Toggle checked={darkMode} onChange={() => dispatch(toggleDarkMode())} />
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell size={18} className="text-primary-500" /> Notifications
        </h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-800">
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-white">Email Notifications</p>
              <p className="text-xs text-surface-400 mt-0.5">Receive notifications via email</p>
            </div>
            <Toggle checked={emailNotif} onChange={setEmailNotif} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-white">Push Notifications</p>
              <p className="text-xs text-surface-400 mt-0.5">Receive browser push notifications</p>
            </div>
            <Toggle checked={pushNotif} onChange={setPushNotif} />
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <Eye size={18} className="text-primary-500" /> Privacy
        </h3>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-white">Public Profile</p>
            <p className="text-xs text-surface-400 mt-0.5">Allow recruiters to view your profile</p>
          </div>
          <Toggle checked={profilePublic} onChange={setProfilePublic} />
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield size={18} className="text-primary-500" /> Security
        </h3>
        <div className="space-y-3">
          <div>
            <label className="input-label">Current Password</label>
            <input type="password" placeholder="••••••••" className="input-field" />
          </div>
          <div>
            <label className="input-label">New Password</label>
            <input type="password" placeholder="••••••••" className="input-field" />
          </div>
          <div>
            <label className="input-label">Confirm New Password</label>
            <input type="password" placeholder="••••••••" className="input-field" />
          </div>
          <button className="btn-primary mt-2">
            <Save size={16} /> Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
