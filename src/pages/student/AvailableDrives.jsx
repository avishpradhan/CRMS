import { useState, useEffect } from 'react';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { Search, Filter, MapPin, DollarSign, Clock, Users, Briefcase, GraduationCap, Paperclip, FileText, File, Image } from 'lucide-react';

export default function AvailableDrives() {
  const [drivesList, setDrivesList] = useState([]);
  const [appliedDriveIds, setAppliedDriveIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [selectedDrive, setSelectedDrive] = useState(null);

  const token = localStorage.getItem('crms_token');

  const isExpired = (deadlineStr) => {
    if (!deadlineStr) return false;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    return todayStr > deadlineStr;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch eligible drives
      const eligibleRes = await fetch('/api/student/eligible-drives', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const eligibleData = await eligibleRes.json();
      if (!eligibleRes.ok) {
        throw new Error(eligibleData.message || 'Failed to fetch eligible drives');
      }

      // 2. Fetch my applications
      const appsRes = await fetch('/api/applications/my', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const appsData = await appsRes.json();
      if (!appsRes.ok) {
        throw new Error(appsData.message || 'Failed to fetch your applications');
      }

      // Map drive schema to frontend properties
      const drivesMapped = (eligibleData.data.drives || []).map(d => ({
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
        status: d.status === 'Published' ? 'Active' : d.status,
      }));

      const appliedIds = (appsData.data.applications || []).map(a => 
        a.driveId?._id || a.driveId
      );

      setDrivesList(drivesMapped);
      setAppliedDriveIds(appliedIds);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (driveId) => {
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ driveId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to apply');
      }

      alert('Application submitted successfully!');
      setSelectedDrive(null);
      fetchData(); // Refresh list to update disabled buttons
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredDrives = drivesList.filter(d => {
    const matchesSearch = d.companyName.toLowerCase().includes(search.toLowerCase()) ||
                          d.role.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = filterBranch === 'All' || d.branches.includes(filterBranch);
    return matchesSearch && matchesBranch && d.status !== 'Closed';
  });

  const branches = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Other'];

  if (loading && drivesList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-surface-400 text-sm">Loading eligible drives...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Available Drives</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Browse and apply to campus recruitment drives you are eligible for</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search by company or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-surface-400" />
          <select
            value={filterBranch}
            onChange={e => setFilterBranch(e.target.value)}
            className="input-field !w-auto"
          >
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Drive Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDrives.map(drive => (
          <div key={drive.id} className="glass-card p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center">
                <Briefcase size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <StatusBadge status={drive.status} />
            </div>

            <h3 className="text-base font-bold text-surface-900 dark:text-white">{drive.companyName}</h3>
            <p className="text-sm text-primary-500 font-medium">{drive.role}</p>

            <div className="mt-3 space-y-2 flex-1">
              <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                <DollarSign size={13} /> <span>{drive.package}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                <MapPin size={13} /> <span>{drive.location}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                <GraduationCap size={13} /> <span>Min CGPA: {drive.minCGPA}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${isExpired(drive.deadline) ? 'text-red-500 font-medium' : 'text-surface-500 dark:text-surface-400'}`}>
                <Clock size={13} /> <span>Deadline: {drive.deadline} {isExpired(drive.deadline) && '(Expired)'}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {drive.skills.slice(0, 3).map((skill, i) => (
                <span key={i} className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 text-[10px] font-medium rounded-md">
                  {skill}
                </span>
              ))}
              {drive.skills.length > 3 && (
                <span className="px-2 py-0.5 text-[10px] text-surface-400">+{drive.skills.length - 3}</span>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700 flex gap-2">
              <button onClick={() => setSelectedDrive(drive)} className="btn-secondary flex-1 py-2 text-xs">
                View Details
              </button>
              {appliedDriveIds.includes(drive.id) ? (
                <button disabled className="btn-secondary flex-1 py-2 text-xs opacity-50 cursor-not-allowed">Applied ✓</button>
              ) : isExpired(drive.deadline) ? (
                <button disabled className="btn-secondary flex-1 py-2 text-xs opacity-50 cursor-not-allowed text-red-500 border-red-200 dark:border-red-900/30">
                  Expired
                </button>
              ) : (
                <button onClick={() => handleApply(drive.id)} className="btn-primary flex-1 py-2 text-xs">
                  Apply Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredDrives.length === 0 && (
        <div className="text-center py-16 text-surface-400">
          <Briefcase size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No drives found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Drive Detail Modal */}
      <Modal isOpen={!!selectedDrive} onClose={() => setSelectedDrive(null)} title={`${selectedDrive?.companyName} – ${selectedDrive?.role}`} size="lg">
        {selectedDrive && (
          <div className="space-y-4">
            <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{selectedDrive.description}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                <p className="text-xs text-surface-400">Package</p>
                <p className="font-bold text-surface-900 dark:text-white">{selectedDrive.package}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                <p className="text-xs text-surface-400">Location</p>
                <p className="font-bold text-surface-900 dark:text-white">{selectedDrive.location}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                <p className="text-xs text-surface-400">Min CGPA</p>
                <p className="font-bold text-surface-900 dark:text-white">{selectedDrive.minCGPA}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                <p className="text-xs text-surface-400">Backlogs</p>
                <p className="font-bold text-surface-900 dark:text-white">{selectedDrive.backlogAllowed ? 'Allowed' : 'Not Allowed'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-surface-400 mb-2">Eligible Branches</p>
              <div className="flex flex-wrap gap-2">
                {selectedDrive.branches.map((b, i) => (
                  <span key={i} className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-lg">{b}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-surface-400 mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {selectedDrive.skills.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 text-xs font-medium rounded-lg">{s}</span>
                ))}
              </div>
            </div>
            {selectedDrive.attachments && selectedDrive.attachments.length > 0 && (
              <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
                <p className="text-xs text-surface-400 mb-2 flex items-center gap-1.5"><Paperclip size={14} /> Attachments</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDrive.attachments.map((file, idx) => {
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

            <div className="flex gap-3 pt-2">
              {appliedDriveIds.includes(selectedDrive.id) ? (
                <button disabled className="btn-primary opacity-50 cursor-not-allowed flex-1">Already Applied ✓</button>
              ) : isExpired(selectedDrive.deadline) ? (
                <button disabled className="btn-secondary opacity-50 cursor-not-allowed flex-1 text-red-500 border-red-200 dark:border-red-900/30">Deadline Expired</button>
              ) : (
                <button onClick={() => handleApply(selectedDrive.id)} className="btn-primary flex-1">Apply Now</button>
              )}
              <button onClick={() => setSelectedDrive(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
