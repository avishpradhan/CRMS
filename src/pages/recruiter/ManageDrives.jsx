import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import StatusBadge from '../../components/shared/StatusBadge';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Eye, Trash2, Edit3, Save, MapPin,
  GraduationCap, Calendar, Users, Code, IndianRupee, FileText,
  Paperclip, File, Image, Loader2,
} from 'lucide-react';

const ALL_BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Other'];

function DriveViewModal({ drive, isOpen, onClose }) {
  if (!drive) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Drive Details" size="lg">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {drive.companyName?.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">{drive.role}</h3>
            <p className="text-sm text-surface-500">{drive.companyName}</p>
          </div>
          <StatusBadge status={drive.status} />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: IndianRupee, label: 'Package', value: drive.package },
            { icon: MapPin, label: 'Location', value: drive.location },
            { icon: GraduationCap, label: 'Min CGPA', value: drive.minCGPA },
            { icon: Calendar, label: 'Deadline', value: drive.deadline },
            { icon: Calendar, label: 'Posted On', value: drive.postedDate },
            { icon: Users, label: 'Applicants', value: drive.applicants },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50">
              <Icon size={16} className="text-primary-500 shrink-0" />
              <div>
                <p className="text-[10px] text-surface-400 uppercase font-semibold">{label}</p>
                <p className="text-sm font-medium text-surface-900 dark:text-white">{value ?? '—'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Backlog */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-surface-500">Backlog Allowed:</span>
          <span className={`font-semibold ${drive.backlogAllowed ? 'text-success-500' : 'text-danger-500'}`}>
            {drive.backlogAllowed ? 'Yes' : 'No'}
          </span>
        </div>

        {/* Skills */}
        {drive.skills?.length > 0 && (
          <div>
            <h4 className="text-xs text-surface-400 uppercase font-semibold mb-2 flex items-center gap-1.5"><Code size={14} /> Skills Required</h4>
            <div className="flex flex-wrap gap-2">
              {drive.skills.map((s, i) => (
                <span key={i} className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-lg">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Branches */}
        {drive.branches?.length > 0 && (
          <div>
            <h4 className="text-xs text-surface-400 uppercase font-semibold mb-2 flex items-center gap-1.5"><GraduationCap size={14} /> Eligible Branches</h4>
            <div className="flex flex-wrap gap-2">
              {drive.branches.map((b, i) => (
                <span key={i} className="px-3 py-1.5 bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 text-xs font-semibold rounded-lg">{b}</span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {drive.description && (
          <div>
            <h4 className="text-xs text-surface-400 uppercase font-semibold mb-2 flex items-center gap-1.5"><FileText size={14} /> Description</h4>
            <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{drive.description}</p>
          </div>
        )}

        {/* Attachments */}
        {drive.attachments && drive.attachments.length > 0 && (
          <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
            <h4 className="text-xs text-surface-400 uppercase font-semibold mb-2 flex items-center gap-1.5"><Paperclip size={14} /> Attachments</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {drive.attachments.map((file, idx) => {
                const isImage = file.fileType?.startsWith('image/');
                const isPdf = file.fileType === 'application/pdf';
                return (
                  <a
                    key={idx}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 hover:bg-surface-100 dark:bg-surface-800/50 dark:hover:bg-surface-800 transition-colors"
                  >
                    {isImage ? (
                      <Image size={18} className="text-info-500 shrink-0" />
                    ) : isPdf ? (
                      <FileText size={18} className="text-danger-500 shrink-0" />
                    ) : (
                      <File size={18} className="text-warning-500 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-surface-900 dark:text-white truncate">
                        {file.filename}
                      </p>
                      <p className="text-[10px] text-surface-500 uppercase">
                        Download / View
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function DriveEditModal({ drive, isOpen, onClose, onSave, loading }) {
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [batches, setBatches] = useState([]);

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

  useEffect(() => {
    if (drive) {
      const batchesArr = drive.eligibleBatch
        ? drive.eligibleBatch.split(',').map(b => b.trim()).filter(Boolean)
        : [];

      setForm({
        companyName: drive.companyName || '',
        role: drive.role || '',
        package: drive.package || '',
        location: drive.location || '',
        skills: Array.isArray(drive.skills) ? drive.skills.join(', ') : drive.skills || '',
        branches: drive.branches || [],
        minCGPA: drive.minCGPA || '',
        backlogAllowed: drive.backlogAllowed || false,
        deadline: drive.deadline || '',
        description: drive.description || '',
        status: drive.dbStatus || 'Active',
        attachments: drive.attachments || [],
        eligibleBatches: batchesArr,
      });
    }
  }, [drive]);

  if (!drive) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleBranch = (branch) => {
    setForm(prev => ({
      ...prev,
      branches: prev.branches.includes(branch)
        ? prev.branches.filter(b => b !== branch)
        : [...prev.branches, branch],
    }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (uploading) {
      alert("Please wait for file upload to complete.");
      return;
    }
    onSave({
      ...drive,
      ...form,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      minCGPA: parseFloat(form.minCGPA) || 0,
      attachments: form.attachments || [],
      eligibleBatch: (form.eligibleBatches || []).join(', '),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Drive" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="input-label">Company Name *</label>
            <input name="companyName" value={form.companyName || ''} onChange={handleChange} className="input-field" required disabled />
          </div>
          <div>
            <label className="input-label">Role *</label>
            <input name="role" value={form.role || ''} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="input-label">Package *</label>
            <input name="package" value={form.package || ''} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="input-label">Location *</label>
            <input name="location" value={form.location || ''} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="input-label">Min CGPA *</label>
            <input name="minCGPA" type="number" step="0.1" value={form.minCGPA || ''} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="input-label">Deadline *</label>
            <input name="deadline" type="date" value={form.deadline || ''} onChange={handleChange} className="input-field" required />
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
                      onChange={() => {
                        const current = form.eligibleBatches || [];
                        const updated = current.includes(canonical)
                          ? current.filter(c => c !== canonical)
                          : [...current, canonical];
                        setForm(prev => ({ ...prev, eligibleBatches: updated }));
                      }}
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
          <label className="input-label">Skills (comma separated) *</label>
          <input name="skills" value={form.skills || ''} onChange={handleChange} className="input-field" required />
        </div>

        <div>
          <label className="input-label">Eligible Branches</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {ALL_BRANCHES.map(branch => (
              <button
                key={branch}
                type="button"
                onClick={() => handleBranch(branch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  form.branches?.includes(branch)
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                }`}
              >
                {branch}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="input-label">Status</label>
          <select name="status" value={form.status || 'Active'} onChange={handleChange} className="input-field bg-transparent">
            <option value="Active" className="dark:bg-surface-900">Active (Published)</option>
            <option value="Upcoming" className="dark:bg-surface-900">Upcoming (Draft)</option>
            <option value="Closed" className="dark:bg-surface-900">Closed</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" name="backlogAllowed" checked={form.backlogAllowed || false} onChange={handleChange} className="w-4 h-4 rounded border-surface-300 text-primary-500" />
          <label className="text-sm text-surface-700 dark:text-surface-300">Backlog allowed</label>
        </div>

        <div>
          <label className="input-label">Job Description</label>
          <textarea name="description" value={form.description || ''} onChange={handleChange} rows="3" className="input-field resize-none" />
        </div>

        <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
          <label className="input-label mb-2 flex items-center gap-1.5 font-semibold">
            <Paperclip size={16} className="text-primary-500" />
            Attachments (PDF, DOC, DOCX, or Images up to 10MB)
          </label>
          <div className="space-y-3">
            {form.attachments && form.attachments.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {form.attachments.map((file, idx) => {
                  const isImage = file.fileType?.startsWith('image/');
                  const isPdf = file.fileType === 'application/pdf';
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50">
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
                            {file.fileType?.split('/')[1] || 'document'}
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
          <button type="submit" disabled={loading || uploading} className={`btn-primary flex-1 ${loading || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ManageDrives() {
  const navigate = useNavigate();
  const [drivesList, setDrivesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);

  const [viewDrive, setViewDrive] = useState(null);
  const [editDrive, setEditDrive] = useState(null);
  const [deleteConfirmDrive, setDeleteConfirmDrive] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const token = localStorage.getItem('crms_token');

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/drives/my', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch drives');
      }

      // Map DB schema to UI expected shape
      const mapped = data.data.map(d => ({
        ...d,
        id: d._id,
        package: d.packageOffered,
        minCGPA: d.minimumCGPA,
        deadline: d.deadline ? new Date(d.deadline).toISOString().split('T')[0] : '',
        postedDate: d.postedDate ? new Date(d.postedDate).toISOString().split('T')[0] : '',
        applicants: 0,
        backlogAllowed: d.maxBacklogs > 0,
        skills: d.skillsRequired || [],
        branches: d.allowedBranches || [],
        status: d.status,
        dbStatus: d.dbStatus === 'Published' ? 'Active' : (d.dbStatus === 'Draft' ? 'Upcoming' : d.dbStatus),
        eligibleBatch: d.eligibleBatch || '',
      }));
      setDrivesList(mapped);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const handleSaveEdit = async (updatedDrive) => {
    try {
      setSaveLoading(true);
      const payload = {
        role: updatedDrive.role,
        packageOffered: updatedDrive.package,
        location: updatedDrive.location,
        minimumCGPA: updatedDrive.minCGPA,
        deadline: updatedDrive.deadline,
        skillsRequired: updatedDrive.skills,
        allowedBranches: updatedDrive.branches,
        status: updatedDrive.status === 'Active' ? 'Published' : (updatedDrive.status === 'Upcoming' ? 'Draft' : updatedDrive.status),
        maxBacklogs: updatedDrive.backlogAllowed ? 1 : 0,
        eligibleBatch: updatedDrive.eligibleBatch || '',
        description: updatedDrive.description,
        attachments: updatedDrive.attachments || [],
      };

      const res = await fetch(`/api/drives/${updatedDrive.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update campus drive');
      }

      alert('Drive updated successfully!');
      setEditDrive(null);
      fetchDrives(); // Reload from DB
    } catch (err) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = (drive) => {
    setDeleteConfirmDrive(drive);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmDrive) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/drives/${deleteConfirmDrive.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete drive');
      }

      setDeleteConfirmDrive(null);
      fetchDrives(); // Reload from DB
    } catch (err) {
      try {
        alert(err.message);
      } catch (ae) {
        console.error('alert() is blocked. Error was:', err.message);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { header: 'Role', accessor: 'role', render: (row) => (
      <div>
        <p className="font-semibold text-surface-900 dark:text-white">{row.role}</p>
        <p className="text-xs text-surface-400">{row.companyName}</p>
      </div>
    )},
    { header: 'Package', accessor: 'package' },
    { header: 'Location', accessor: 'location' },
    { header: 'Deadline', accessor: 'deadline' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  if (loading && drivesList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-surface-400 text-sm">Loading drives...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Manage Drives</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">{drivesList.length} drives posted</p>
        </div>
        <button onClick={() => navigate('/recruiter/post-drive')} className="btn-primary">
          <PlusCircle size={16} /> Post New Drive
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={drivesList}
        searchPlaceholder="Search drives..."
        actions={(row) => (
          <>
            <button
              onClick={() => setViewDrive(row)}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              title="View"
            >
              <Eye size={15} className="text-surface-500" />
            </button>
            <button
              onClick={() => setEditDrive(row)}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              title="Edit"
            >
              <Edit3 size={15} className="text-primary-500" />
            </button>
            <button
              onClick={() => handleDelete(row)}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              title="Delete"
            >
              <Trash2 size={15} className="text-red-500" />
            </button>
          </>
        )}
      />

      {/* View Modal */}
      <DriveViewModal
        drive={viewDrive}
        isOpen={!!viewDrive}
        onClose={() => setViewDrive(null)}
      />

      {/* Edit Modal */}
      <DriveEditModal
        drive={editDrive}
        isOpen={!!editDrive}
        onClose={() => setEditDrive(null)}
        onSave={handleSaveEdit}
        loading={saveLoading}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmDrive}
        onClose={() => setDeleteConfirmDrive(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Are you sure you want to delete the campus drive for <strong className="text-surface-900 dark:text-white">{deleteConfirmDrive?.role}</strong> at <strong className="text-surface-900 dark:text-white">{deleteConfirmDrive?.companyName}</strong>?
          </p>
          <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-800">
            <strong>Warning:</strong> This will permanently delete the drive. Any stages or student applications related to this drive will also be cleaned up.
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="btn-primary bg-red-600 hover:bg-red-500 text-white flex-1"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setDeleteConfirmDrive(null)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
