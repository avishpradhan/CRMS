import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginDemo } from '../../store/slices/authSlice';
import { currentUser } from '../../data/mockData';
import { GraduationCap, Building2, Shield, ArrowRight } from 'lucide-react';

const roles = [
  {
    id: 'student',
    title: 'Student',
    description: 'Access campus drives, track applications, and manage your profile.',
    icon: GraduationCap,
    color: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/25',
  },
  {
    id: 'recruiter',
    title: 'Recruiter',
    description: 'Post drives, manage applicants, and schedule interviews.',
    icon: Building2,
    color: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/25',
  },
  {
    id: 'admin',
    title: 'Admin',
    description: 'Manage students, recruiters, drives, and view analytics.',
    icon: Shield,
    color: 'from-purple-500 to-violet-600',
    shadow: 'shadow-purple-500/25',
  },
];

export default function SelectRole() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSelect = (role) => {
    dispatch(loginDemo({ user: currentUser[role], role }));
    navigate(`/${role}/dashboard`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Select Your Role</h1>
          <p className="text-surface-500 dark:text-surface-400">Choose how you'd like to access the CRMS platform</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {roles.map((role, i) => (
            <button
              key={role.id}
              onClick={() => handleSelect(role.id)}
              className="glass-card p-6 text-left group hover:!shadow-xl transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-5 ${role.shadow} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <role.icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">{role.title}</h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-5 leading-relaxed">{role.description}</p>
              <div className="flex items-center gap-1 text-sm font-semibold text-primary-500 group-hover:gap-2 transition-all">
                Continue <ArrowRight size={16} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
