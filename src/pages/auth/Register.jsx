import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../store/slices/authSlice';
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.auth);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'student', inviteCode: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (form.role === 'student' && !form.inviteCode) {
      setError('Invitation code is required for student registration');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await dispatch(registerUser({
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        inviteCode: form.role === 'student' ? form.inviteCode : undefined,
      })).unwrap();
      navigate('/login');
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="min-h-screen flex gradient-mesh">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-32 left-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-white max-w-lg">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">Join the CRMS<br />Community</h1>
          <p className="text-lg text-white/80 mb-8">
            Create your account to start exploring campus placement opportunities and connect with top companies.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">✓</div>
              <span>Access to 50+ top recruiters</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">✓</div>
              <span>Track your applications in real-time</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">✓</div>
              <span>Get notified about new drives instantly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-surface-900 dark:text-white">CRMS</h1>
              <p className="text-[11px] text-surface-400">Campus Recruitment</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">Create Account</h2>
          <p className="text-surface-500 dark:text-surface-400 mb-8">Fill in your details to get started</p>

          {error && (
            <div className="mb-4 p-3 bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Full Name *</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label className="input-label">Email Address *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@university.edu" className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label className="input-label">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label className="input-label">Role *</label>
              <select name="role" value={form.role} onChange={handleChange} className="input-field">
                <option value="student">Student</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </div>

            {form.role === 'student' && (
              <div className="animate-fade-in">
                <label className="input-label">Invitation Code * (provided by admin)</label>
                <input
                  name="inviteCode"
                  value={form.inviteCode}
                  onChange={handleChange}
                  placeholder="e.g. GEU2327"
                  className="input-field uppercase"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="••••••••" className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="input-label">Confirm *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input name="confirmPassword" type={showPass ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" className="input-field pl-10" />
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
              <input type="checkbox" className="w-4 h-4 mt-0.5 rounded border-surface-300 text-primary-500" />
              <span>I agree to the <a href="#" className="text-primary-500 hover:underline">Terms of Service</a> and <a href="#" className="text-primary-500 hover:underline">Privacy Policy</a></span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
