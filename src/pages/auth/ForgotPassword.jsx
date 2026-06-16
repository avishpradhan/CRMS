import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <GraduationCap size={24} className="text-white" />
          </div>
        </div>

        <div className="glass-card p-8">
          {!sent ? (
            <>
              <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-1 text-center">Reset Password</h2>
              <p className="text-surface-500 dark:text-surface-400 mb-8 text-center text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                <button type="submit" className="btn-primary w-full py-3">
                  Send Reset Link <ArrowRight size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-success-50 dark:bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-success-500" />
              </div>
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Check your email</h2>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
                We've sent a password reset link to <strong className="text-surface-700 dark:text-surface-300">{email}</strong>
              </p>
              <button onClick={() => setSent(false)} className="btn-secondary">
                Try another email
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium">
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
