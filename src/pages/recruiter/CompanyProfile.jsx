import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchRecruiterProfile,
  createRecruiterProfile,
  updateRecruiterProfile,
  clearError,
} from '../../store/slices/authSlice';
import {
  Building2,
  Globe,
  Mail,
  Phone,
  Users,
  Briefcase,
  Edit3,
  Save,
  MapPin,
  User,
  Info,
  ShieldAlert,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
} from 'lucide-react';

const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001-10000',
  '10000+',
];

const EMPTY_FORM = {
  companyName: '',
  companyWebsite: '',
  companyEmail: '',
  industry: '',
  companySize: '1-10',
  companyDescription: '',
  headquarters: '',
  contactPerson: '',
  contactPhone: '',
  logoUrl: '',
};

function profileToForm(profile) {
  return {
    companyName: profile?.companyName || '',
    companyWebsite: profile?.companyWebsite || '',
    companyEmail: profile?.companyEmail || '',
    industry: profile?.industry || '',
    companySize: profile?.companySize || '1-10',
    companyDescription: profile?.companyDescription || '',
    headquarters: profile?.headquarters || '',
    contactPerson: profile?.contactPerson || '',
    contactPhone: profile?.contactPhone || '',
    logoUrl: profile?.logoUrl || '',
  };
}

function VerificationBadge({ status }) {
  const config = {
    Pending: { icon: Clock, color: 'text-warning-500', bg: 'bg-warning-50 dark:bg-warning-500/10', label: 'Pending Verification' },
    Approved: { icon: CheckCircle, color: 'text-success-500', bg: 'bg-success-50 dark:bg-success-500/10', label: 'Verified' },
    Rejected: { icon: XCircle, color: 'text-danger-500', bg: 'bg-danger-50 dark:bg-danger-500/10', label: 'Rejected' },
  };
  const c = config[status] || config.Pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${c.color} ${c.bg}`}>
      <Icon size={14} /> {c.label}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-surface-100 dark:border-surface-800 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-primary-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-surface-400 font-medium">{label}</p>
        <p className="text-sm font-medium text-surface-900 dark:text-white mt-0.5 break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

function FormField({ label, children, required }) {
  return (
    <div>
      <label className="input-label text-xs">
        {label} {required && <span className="text-danger-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function CompanyProfile() {
  const dispatch = useDispatch();
  const { user, loading, error, recruiterProfile } = useSelector((state) => state.auth);

  const [mode, setMode] = useState('loading'); // loading | create | view | edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch profile on mount
  useEffect(() => {
    dispatch(clearError());
    dispatch(fetchRecruiterProfile())
      .unwrap()
      .then(() => setMode('view'))
      .catch(() => setMode('create'));
  }, [dispatch]);

  // Sync form when profile loads or mode changes
  useEffect(() => {
    if (recruiterProfile && (mode === 'view' || mode === 'edit')) {
      setForm(profileToForm(recruiterProfile));
    }
  }, [recruiterProfile, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const required = ['companyName', 'companyWebsite', 'companyEmail', 'industry', 'companySize', 'companyDescription', 'headquarters', 'contactPerson', 'contactPhone'];
    for (const field of required) {
      if (!form[field]?.trim()) {
        return `${field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} is required`;
      }
    }
    if (!/^\S+@\S+\.\S+$/.test(form.companyEmail)) return 'Please enter a valid company email';
    if (!/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/.test(form.companyWebsite)) return 'Please enter a valid website URL';
    if (!/^\+?[0-9]{10,15}$/.test(form.contactPhone)) return 'Please enter a valid phone number (10-15 digits)';
    return null;
  };

  const handleSubmit = async () => {
    setFormError('');
    setSuccessMsg('');
    const err = validate();
    if (err) { setFormError(err); return; }

    try {
      if (mode === 'create') {
        await dispatch(createRecruiterProfile(form)).unwrap();
        setSuccessMsg('Company profile created successfully!');
        setMode('view');
      } else {
        await dispatch(updateRecruiterProfile(form)).unwrap();
        setSuccessMsg('Company profile updated successfully!');
        setMode('view');
      }
    } catch (e) {
      setFormError(e || 'Something went wrong');
    }
  };

  const startEdit = () => {
    setFormError('');
    setSuccessMsg('');
    setForm(profileToForm(recruiterProfile));
    setMode('edit');
  };

  const cancelEdit = () => {
    setFormError('');
    setForm(profileToForm(recruiterProfile));
    setMode('view');
  };

  // ─── Loading ─────────────────────────────────
  if (mode === 'loading') {
    return (
      <div className="max-w-4xl mx-auto py-20 flex items-center justify-center">
        <div className="text-surface-400 text-sm animate-pulse">Loading company profile…</div>
      </div>
    );
  }

  // ─── Create / Edit Form ──────────────────────
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
              {mode === 'create' ? 'Set Up Company Profile' : 'Edit Company Profile'}
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1">
              {mode === 'create'
                ? 'Fill in your company details to get started with campus recruitment'
                : 'Update your company information'}
            </p>
          </div>
          <div className="flex gap-2">
            {mode === 'edit' && (
              <button onClick={cancelEdit} className="btn-secondary py-2 px-4">
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary py-2 px-4"
            >
              {loading ? (
                <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Saving…</>
              ) : (
                <><Save size={16} /> {mode === 'create' ? 'Create Profile' : 'Save Changes'}</>
              )}
            </button>
          </div>
        </div>

        {/* Error / Success */}
        {(formError || error) && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium flex items-center gap-2">
            <ShieldAlert size={18} /> <span>{formError || error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-success-50 dark:bg-success-500/10 border border-success-500/20 text-success-600 dark:text-success-500 rounded-xl text-sm font-medium flex items-center gap-2">
            <CheckCircle size={18} /> <span>{successMsg}</span>
          </div>
        )}

        {/* Form Cards */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Company Details */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Building2 size={16} className="text-primary-500" /> Company Details
            </h3>

            <FormField label="Company Name" required>
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="e.g. Acme Technologies"
                className="input-field text-sm py-2"
              />
            </FormField>

            <FormField label="Industry" required>
              <input
                name="industry"
                value={form.industry}
                onChange={handleChange}
                placeholder="e.g. Information Technology"
                className="input-field text-sm py-2"
              />
            </FormField>

            <FormField label="Company Size" required>
              <select
                name="companySize"
                value={form.companySize}
                onChange={handleChange}
                className="input-field text-sm py-2 bg-transparent"
              >
                {COMPANY_SIZES.map((s) => (
                  <option key={s} value={s} className="dark:bg-surface-900">{s} employees</option>
                ))}
              </select>
            </FormField>

            <FormField label="Headquarters" required>
              <input
                name="headquarters"
                value={form.headquarters}
                onChange={handleChange}
                placeholder="e.g. Bangalore, India"
                className="input-field text-sm py-2"
              />
            </FormField>

            <FormField label="Company Website" required>
              <input
                name="companyWebsite"
                value={form.companyWebsite}
                onChange={handleChange}
                placeholder="e.g. https://acme.com"
                className="input-field text-sm py-2"
              />
            </FormField>

            <FormField label="Company Logo URL">
              <input
                name="logoUrl"
                value={form.logoUrl}
                onChange={handleChange}
                placeholder="e.g. https://acme.com/logo.png"
                className="input-field text-sm py-2"
              />
            </FormField>
          </div>

          {/* Contact & About */}
          <div className="space-y-6">
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <User size={16} className="text-primary-500" /> Contact Information
              </h3>

              <FormField label="Company Email" required>
                <input
                  name="companyEmail"
                  type="email"
                  value={form.companyEmail}
                  onChange={handleChange}
                  placeholder="e.g. hr@acme.com"
                  className="input-field text-sm py-2"
                />
              </FormField>

              <FormField label="Contact Person" required>
                <input
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="input-field text-sm py-2"
                />
              </FormField>

              <FormField label="Contact Phone" required>
                <input
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleChange}
                  placeholder="e.g. +919876543210"
                  className="input-field text-sm py-2"
                />
              </FormField>
            </div>

            <div className="glass-card p-5 space-y-4">
              <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <Info size={16} className="text-primary-500" /> About Company
              </h3>

              <FormField label="Company Description" required>
                <textarea
                  name="companyDescription"
                  value={form.companyDescription}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe your company, culture, and what you look for in candidates…"
                  className="input-field text-sm py-2 resize-none"
                />
              </FormField>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── View Mode ───────────────────────────────
  const profile = recruiterProfile;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Company Profile</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Manage your company information</p>
        </div>
        <button onClick={startEdit} className="btn-primary">
          <Edit3 size={16} /> Edit Profile
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="p-3 bg-success-50 dark:bg-success-500/10 border border-success-500/20 text-success-600 dark:text-success-500 rounded-xl text-sm font-medium flex items-center gap-2">
          <CheckCircle size={18} /> <span>{successMsg}</span>
        </div>
      )}

      {/* Company Header Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {profile?.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt={profile.companyName}
              className="w-20 h-20 rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/20">
              {profile?.companyName?.charAt(0) || 'C'}
            </div>
          )}
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white">{profile?.companyName}</h2>
            <p className="text-sm text-surface-500 dark:text-surface-400">{profile?.industry}</p>
            <p className="text-xs text-surface-400 mt-1">
              <MapPin size={12} className="inline mr-1" />{profile?.headquarters}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <VerificationBadge status={profile?.verificationStatus} />
            <span className="text-[11px] text-surface-400">
              {profile?.companySize} employees
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={16} className="text-primary-500" /> Contact Information
          </h3>
          <div className="space-y-0">
            <InfoRow icon={Mail} label="Company Email" value={profile?.companyEmail} />
            <InfoRow icon={Phone} label="Contact Phone" value={profile?.contactPhone} />
            <InfoRow icon={Globe} label="Website" value={profile?.companyWebsite} />
            <InfoRow icon={User} label="Contact Person" value={profile?.contactPerson} />
          </div>
        </div>

        {/* About */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <Info size={16} className="text-primary-500" /> About Company
          </h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
            {profile?.companyDescription || '—'}
          </p>
          <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
            <h4 className="text-xs text-surface-400 mb-2">Industry</h4>
            <span className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-lg">
              {profile?.industry}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
            <h4 className="text-xs text-surface-400 mb-2">Member Since</h4>
            <p className="text-sm font-medium text-surface-900 dark:text-white">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
