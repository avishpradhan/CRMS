import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

export default function Login() {
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
      navigate(`/${result.user.role}/dashboard`);
    } catch (err) {
      setError(err);
    }
  };


  return (
    <div className="min-h-screen flex gradient-mesh">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-white max-w-lg">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">Campus Recruitment<br />Management System</h1>
          <p className="text-lg text-white/80 mb-8">
            Streamline your campus placement process. Connect students with top recruiters seamlessly.
          </p>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm text-white/70">Students</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">50+</p>
              <p className="text-sm text-white/70">Companies</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">85%</p>
              <p className="text-sm text-white/70">Placement Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
          <Link to="/admin/login" className="btn-secondary py-1.5 px-3 text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors shadow-sm">
            <Shield size={14} className="text-primary-500" /> Admin Portal
          </Link>
        </div>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-surface-900 dark:text-white">CRMS</h1>
              <p className="text-[11px] text-surface-400">Campus Recruitment</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">Welcome back</h2>
          <p className="text-surface-500 dark:text-surface-400 mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="mb-4 p-3 bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="input-label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                <input type="checkbox" className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-500 hover:text-primary-600 font-semibold">Sign up</Link>
          </p>


        </div>
      </div>
    </div>
  );
}
