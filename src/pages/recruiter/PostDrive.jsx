import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Save, ArrowLeft, Paperclip, FileText, File, Image, Trash2, Loader2 } from 'lucide-react';

export default function PostDrive() {
  const navigate = useNavigate();
  const { user, recruiterProfile } = useSelector(state => state.auth);
  const companyName = recruiterProfile?.companyName || user?.companyName || '';
  const [form, setForm] = useState({
    companyName,
    role: '',
    package: '',
    location: '',
    skills: '',
    branches: [],
    minCGPA: '',
    backlogAllowed: false,
    deadline: '',
    description: '',
    attachments: [],
    eligibleBatches: [],
  });
  const [batches, setBatches] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const token = localStorage.getItem('crms_token');
        const res = await fetch('/api/admin/batches', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setBatches(data.data?.filter(b => b.isActive) || []);
        }
      } catch (err) {
        console.error('Error fetching batches:', err);
      }
    };
    fetchBatches();
  }, []);

  const allBranches = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Other'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleBranch = (branch) => {
    setForm(prev => ({
      ...prev,
      branches: prev.branches.includes(branch)
        ? prev.branches.filter(b => b !== branch)
        : [...prev.branches, branch]
    }));
  };

  const handleBatchToggle = (canonical) => {
    setForm(prev => {
      const current = prev.eligibleBatches || [];
      const updated = current.includes(canonical)
        ? current.filter(c => c !== canonical)
        : [...current, canonical];
      return { ...prev, eligibleBatches: updated };
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    const formData = new FormData();
    formData.append('attachment', file);

    setUploading(true);
    try {
      const token = localStorage.getItem('crms_token');
      const res = await fetch('/api/drives/upload-attachment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload attachment');
      }

      setForm(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), data.data]
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (index) => {
    setForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) {
      alert("Please wait for file upload to complete.");
      return;
    }
    try {
      const token = localStorage.getItem('crms_token');
      const payload = {
        role: form.role,
        packageOffered: form.package,
        location: form.location,
        allowedBranches: form.branches,
        minimumCGPA: parseFloat(form.minCGPA) || 0.0,
        maxBacklogs: form.backlogAllowed ? 1 : 0,
        eligibleBatch: (form.eligibleBatches || []).join(', '),
        deadline: form.deadline,
        description: form.description,
        skillsRequired: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        status: 'Draft',
        attachments: form.attachments,
      };

      const res = await fetch('/api/drives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to post drive');
      }

      setSubmitted(true);
      setTimeout(() => navigate('/recruiter/drives'), 1500);
    } catch (err) {
      alert(err.message);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="text-center glass-card p-10">
          <div className="w-16 h-16 bg-success-50 dark:bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusCircle size={32} className="text-success-500" />
          </div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Drive Posted Successfully!</h2>
          <p className="text-sm text-surface-500">Redirecting to Manage Drives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
          <ArrowLeft size={20} className="text-surface-600 dark:text-surface-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Post New Drive</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Create a new campus recruitment drive</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Company Name</label>
            <input name="companyName" value={form.companyName} onChange={handleChange} className="input-field" required disabled />
          </div>
          <div>
            <label className="input-label">Role / Position *</label>
            <input name="role" value={form.role} onChange={handleChange} placeholder="e.g., Software Engineer" className="input-field" required />
          </div>
          <div>
            <label className="input-label">Package *</label>
            <input name="package" value={form.package} onChange={handleChange} placeholder="e.g., ₹12 LPA" className="input-field" required />
          </div>
          <div>
            <label className="input-label">Location *</label>
            <input name="location" value={form.location} onChange={handleChange} placeholder="e.g., Bangalore, India" className="input-field" required />
          </div>
          <div>
            <label className="input-label">Minimum CGPA *</label>
            <input name="minCGPA" type="number" step="0.1" value={form.minCGPA} onChange={handleChange} placeholder="e.g., 7.0" className="input-field" required />
          </div>
          <div>
            <label className="input-label">Application Deadline *</label>
            <input name="deadline" type="date" value={form.deadline} onChange={handleChange} className="input-field" required />
          </div>
          <div className="col-span-2">
            <label className="input-label">Eligible Batches *</label>
            <div className="flex flex-wrap gap-3 mt-1">
              {batches.map(b => {
                const canonical = b.canonicalBatch || `${b.startYear}-${b.endYear}`;
                const isChecked = form.eligibleBatches?.includes(canonical);
                return (
                  <label key={b._id} className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 bg-surface-50 dark:bg-surface-800/40 px-3.5 py-2 rounded-xl border border-surface-200/50 dark:border-surface-700/50 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleBatchToggle(canonical)}
                      className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500/20"
                    />
                    <span className="font-medium">{canonical}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <label className="input-label">Skills Required * (comma separated)</label>
          <input name="skills" value={form.skills} onChange={handleChange} placeholder="e.g., React, Node.js, MongoDB" className="input-field" required />
        </div>

        <div>
          <label className="input-label">Eligible Branches *</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {allBranches.map(branch => (
              <button
                key={branch}
                type="button"
                onClick={() => handleBranch(branch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  form.branches.includes(branch)
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                }`}
              >
                {branch}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" name="backlogAllowed" checked={form.backlogAllowed} onChange={handleChange} className="w-4 h-4 rounded border-surface-300 text-primary-500" />
          <label className="text-sm text-surface-700 dark:text-surface-300">Backlog allowed</label>
        </div>

        <div>
          <label className="input-label">Job Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows="4" placeholder="Describe the role, responsibilities, and requirements..." className="input-field" />
        </div>

        <div className="border-t border-surface-200 dark:border-surface-700 pt-5">
          <label className="input-label mb-2 flex items-center gap-1.5 font-semibold">
            <Paperclip size={16} className="text-primary-500" />
            Attachments (PDF, DOC, DOCX, or Images up to 10MB)
          </label>
          <div className="space-y-3">
            {form.attachments && form.attachments.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {form.attachments.map((file, idx) => {
                  const isImage = file.fileType.startsWith('image/');
                  const isPdf = file.fileType === 'application/pdf';
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 animate-fade-in">
                      <div className="flex items-center gap-3">
                        {isImage ? (
                          <Image size={20} className="text-info-500" />
                        ) : isPdf ? (
                          <FileText size={20} className="text-danger-500" />
                        ) : (
                          <File size={20} className="text-warning-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-surface-900 dark:text-white truncate max-w-[250px] sm:max-w-md">
                            {file.filename}
                          </p>
                          <p className="text-xs text-surface-500 capitalize">
                            {file.fileType.split('/')[1] || 'document'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="p-1.5 rounded-lg text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary-300 dark:border-primary-700 text-sm font-semibold text-primary-600 dark:text-primary-400 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} />
                    Add File
                  </>
                )}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,image/*"
                  className="hidden"
                />
              </label>
              <span className="text-xs text-surface-500">
                PDF, Word, PNG, JPG, JPEG, or WEBP. Max 10MB.
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={uploading} className={`btn-primary flex-1 py-3 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Save size={16} /> Post Drive
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
