import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();
      if (result.user.role !== 'admin') {
        setError('Access denied. Standard users must sign in via the main portal.');
        // Log out user if they logged in with non-admin role in admin portal
        // (Just showing error for user safety)
        return;
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-6 gradient-mesh relative bg-surface-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-900/50 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/50 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md glass-card p-8 relative z-10 border border-surface-800 bg-surface-900/60 shadow-2xl rounded-2xl">
        {/* Header Branding */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Admin Portal</h1>
            <p className="text-[10px] text-surface-400 font-medium uppercase tracking-widest">System Control</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white text-center mb-6">Administrator Sign In</h2>

        {error && (
          <div className="mb-5 p-3 bg-danger-500/10 text-danger-400 text-sm rounded-xl border border-danger-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="input-label !text-surface-300">Admin Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@crms.com"
                className="input-field pl-10 !bg-surface-800/80 !border-surface-700 !text-white focus:!border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="input-label !text-surface-300">Secret Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10 pr-10 !bg-surface-800/80 !border-surface-700 !text-white focus:!border-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 !bg-gradient-to-r !from-indigo-600 !to-purple-700 hover:!from-indigo-500 hover:!to-purple-600 shadow-indigo-900/30"
          >
            {loading ? 'Authenticating...' : 'Secure Login'} <ArrowRight size={16} />
          </button>
        </form>



        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-xs text-surface-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            ← Back to Student & Recruiter Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
