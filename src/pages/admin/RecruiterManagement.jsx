import { useState, useEffect } from 'react';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import {
  CheckCircle, XCircle, Ban, RefreshCw, Eye, Globe,
  Building, Users, Phone, Mail, MapPin, Calendar, Info,
} from 'lucide-react';

function RecruiterViewModal({ recruiter, isOpen, onClose }) {
  if (!recruiter) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recruiter Company Profile" size="lg">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start gap-4 pb-4 border-b border-surface-150 dark:border-surface-700">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg shadow-emerald-500/10">
            {recruiter.companyName ? recruiter.companyName.charAt(0) : 'R'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-surface-900 dark:text-white truncate">{recruiter.companyName}</h3>
            <p className="text-sm text-primary-500 font-medium">{recruiter.industry || 'Technology'}</p>
            {recruiter.companyWebsite && (
              <a
                href={recruiter.companyWebsite.startsWith('http') ? recruiter.companyWebsite : `https://${recruiter.companyWebsite}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-surface-500 hover:text-primary-500 transition-colors flex items-center gap-1 mt-1 font-semibold"
              >
                <Globe size={12} /> {recruiter.companyWebsite}
              </a>
            )}
          </div>
          <StatusBadge status={recruiter.status} />
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: Users, label: 'Company Size', value: recruiter.companySize },
            { icon: MapPin, label: 'Headquarters', value: recruiter.headquarters },
            { icon: Mail, label: 'Company Email', value: recruiter.companyEmail },
            { icon: Phone, label: 'Contact Phone', value: recruiter.contactPhone },
            { icon: Info, label: 'Contact Person', value: recruiter.contactPerson },
            { icon: Calendar, label: 'Registered On', value: recruiter.createdAt ? new Date(recruiter.createdAt).toLocaleDateString() : 'N/A' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3.5 p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/50 dark:border-surface-700/30">
              <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-surface-400 uppercase font-semibold tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 truncate">{value || '—'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Description Section */}
        {recruiter.companyDescription && (
          <div className="space-y-2">
            <h4 className="text-xs text-surface-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Building size={14} /> About the Company
            </h4>
            <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed bg-surface-50/50 dark:bg-surface-800/10 p-4 rounded-xl border border-surface-200/30 dark:border-surface-800/30">
              {recruiter.companyDescription}
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="btn-secondary px-5 py-2">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function RecruiterManagement() {
  const [recruiterList, setRecruiterList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewRecruiter, setViewRecruiter] = useState(null);

  const token = localStorage.getItem('crms_token');

  const fetchRecruiters = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/recruiters', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch recruiters');
      }

      // Map DB schema to UI expected shape
      const mapped = data.data.map(r => ({
        ...r,
        id: r._id || r.userId._id, // fallback to userId if profile is missing
        status: r.verificationStatus === 'Approved' ? 'Active' : r.verificationStatus,
      }));
      setRecruiterList(mapped);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`/api/admin/recruiters/${id}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to ${action} recruiter`);
      }

      alert(`Recruiter ${action}ed successfully!`);
      fetchRecruiters(); // Refresh list
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    { header: 'Company', accessor: 'companyName', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {row.companyName ? row.companyName.charAt(0) : 'R'}
        </div>
        <div>
          <p className="font-semibold text-surface-900 dark:text-white text-sm">{row.companyName}</p>
          <p className="text-[11px] text-surface-400">{row.industry || 'IT'}</p>
        </div>
      </div>
    )},
    { header: 'Contact Person', accessor: 'contactPerson' },
    { header: 'Email', accessor: 'companyEmail', render: (row) => (
      <span className="text-xs text-surface-500">{row.companyEmail}</span>
    )},
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  if (loading && recruiterList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-surface-400 text-sm">Loading recruiters...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Recruiter Management</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">{recruiterList.length} registered recruiters</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={recruiterList}
        searchPlaceholder="Search recruiters..."
        actions={(row) => (
          <>
            <button
              onClick={() => setViewRecruiter(row)}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              title="View Profile Details"
            >
              <Eye size={15} className="text-surface-500" />
            </button>
            {row.status === 'Pending' && (
              <button onClick={() => handleAction(row.id, 'approve')} className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-1">
                <CheckCircle size={13} /> Approve
              </button>
            )}
            {row.status === 'Pending' && (
              <button onClick={() => handleAction(row.id, 'reject')} className="px-3 py-1.5 text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1">
                <XCircle size={13} /> Reject
              </button>
            )}
            {row.status === 'Active' && (
              <button onClick={() => handleAction(row.id, 'suspend')} className="px-3 py-1.5 text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center gap-1">
                <Ban size={13} /> Suspend
              </button>
            )}
            {row.status === 'Suspended' && (
              <button onClick={() => handleAction(row.id, 'reactivate')} className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-1">
                <RefreshCw size={13} className="animate-spin-slow" /> Reactivate
              </button>
            )}
          </>
        )}
      />

      <RecruiterViewModal
        recruiter={viewRecruiter}
        isOpen={!!viewRecruiter}
        onClose={() => setViewRecruiter(null)}
      />
    </div>
  );
}
