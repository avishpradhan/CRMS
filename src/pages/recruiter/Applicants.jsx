import { useState, useEffect } from 'react';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { UserCheck, UserX, Calendar, Eye, FileText, Filter, BookOpen, Plus, Trash2, Edit, X, UploadCloud, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export default function Applicants() {
  const [applicantList, setApplicantList] = useState([]);
  const [drivesList, setDrivesList] = useState([]);
  const [filterDrive, setFilterDrive] = useState('All');
  const [stages, setStages] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resume Screening dynamic tab state & checkbox selection state
  const [activeTab, setActiveTab] = useState('screening');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [isAddStageOpen, setIsAddStageOpen] = useState(false);
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false);
  const [activeStageForUpload, setActiveStageForUpload] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [stageAttachments, setStageAttachments] = useState([]);
  const [editingStage, setEditingStage] = useState(null);

  // New stage form state
  const [newStage, setNewStage] = useState({
    stageOrder: 1,
    stageName: 'Online Assessment',
    stageType: 'Online Assessment',
    description: '',
    isFinalStage: false
  });

  const token = localStorage.getItem('crms_token');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch recruiter's applications
      const appsRes = await fetch('/api/applications/recruiter', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const appsData = await appsRes.json();
      if (!appsRes.ok) {
        throw new Error(appsData.message || 'Failed to fetch applicants');
      }

      // 2. Fetch recruiter's drives
      const drivesRes = await fetch('/api/drives/my', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const drivesData = await drivesRes.json();
      if (!drivesRes.ok) {
        throw new Error(drivesData.message || 'Failed to fetch drives');
      }

      // Map drive data
      const drivesMapped = (drivesData.data || []).map(d => ({
        id: d._id,
        role: d.role,
        companyName: d.companyName,
      }));
      setDrivesList(drivesMapped);

      // Map application data, resolving candidate profile properties
      const mappedApps = (appsData.data || []).map(app => {
        const profile = app.studentProfileId || {};
        const userObj = profile.userId || {};
        
        return {
          id: app._id,
          status: app.pipelineStatus || app.status,
          appliedDate: app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'N/A',
          driveId: app.driveId?._id,
          drive: {
            id: app.driveId?._id,
            role: app.driveId?.role || 'Unknown Role',
            companyName: app.driveId?.companyName || 'Unknown Company',
          },
          currentStage: app.currentStageId ? app.currentStageId.stageName : 'Applied (No Stage)',
          currentStageId: app.currentStageId?._id,
          isSystemStage: app.currentStageId ? app.currentStageId.isSystemStage : false,
          statusReason: app.statusReason || '',
          student: {
            id: userObj._id,
            name: userObj.fullName || 'Unknown Student',
            email: userObj.email || '',
            phone: profile.phone || '—',
            branch: profile.branch || 'Not Profiled',
            cgpa: profile.cgpa != null ? profile.cgpa : '—',
            skills: profile.skills || [],
            projects: profile.projects || [],
            resume: profile.resumeUrl || '',
            semester: profile.semester || '—',
            batch: profile.batch || '—',
            backlogs: profile.backlogs ?? 0,
            linkedinUrl: profile.linkedinUrl || '',
            githubUrl: profile.githubUrl || '',
          }
        };
      });

      setApplicantList(mappedApps);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async (driveId) => {
    if (driveId === 'All') {
      setStages([]);
      return;
    }
    try {
      const res = await fetch(`/api/drives/${driveId}/stages`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const fetchedStages = data.data || [];
        setStages(fetchedStages);
        const customStagesCount = fetchedStages.filter(s => !s.isSystemStage).length;
        setNewStage(prev => ({ ...prev, stageOrder: customStagesCount + 1 }));
      }
    } catch (err) {
      console.error('Fetch stages error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchStages(filterDrive);
  }, [filterDrive]);

  const handleAction = async (appId, newStatus) => {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update application status');
      }

      alert(`Application updated to: ${newStatus}`);
      fetchData(); // Refresh list
    } catch (err) {
      alert(err.message);
    }
  };

  // Stage CRUD operations
  const handleAddStage = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('stageOrder', newStage.stageOrder);
      formData.append('stageName', newStage.stageName || 'Online Assessment');
      formData.append('stageType', newStage.stageType);
      formData.append('description', newStage.description);
      formData.append('isFinalStage', newStage.isFinalStage);
      
      // Append multiple attachments
      if (stageAttachments && stageAttachments.length > 0) {
        stageAttachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      const res = await fetch(`/api/drives/${filterDrive}/stages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add recruitment stage');
      }

      setIsAddStageOpen(false);
      setStageAttachments([]);
      setNewStage({
        stageOrder: stages.filter(s => !s.isSystemStage).length + 2,
        stageName: 'Online Assessment',
        stageType: 'Online Assessment',
        description: '',
        isFinalStage: false
      });
      fetchStages(filterDrive);
      fetchData(); // reload applicants to reflect new stage backfills
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditStage = async (e) => {
    e.preventDefault();
    if (!editingStage) return;

    try {
      const formData = new FormData();
      formData.append('stageOrder', editingStage.stageOrder);
      formData.append('stageName', editingStage.stageName || 'Online Assessment');
      formData.append('stageType', editingStage.stageType);
      formData.append('description', editingStage.description || '');
      formData.append('isFinalStage', editingStage.isFinalStage);
      
      // Send the list of existing attachments that were not deleted
      formData.append('existingAttachments', JSON.stringify(editingStage.attachments || []));
      
      // Append any newly selected attachments
      if (stageAttachments && stageAttachments.length > 0) {
        stageAttachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      const res = await fetch(`/api/stages/${editingStage._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update recruitment stage');
      }

      setEditingStage(null);
      setStageAttachments([]);
      fetchStages(filterDrive);
      fetchData(); // reload applicants
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteStage = async (stageId) => {
    if (!window.confirm('Are you sure you want to delete this recruitment stage?')) return;
    try {
      const res = await fetch(`/api/stages/${stageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete recruitment stage');
      }
      fetchStages(filterDrive);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // CSV Import execution
  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile || !activeStageForUpload) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const res = await fetch(`/api/stages/${activeStageForUpload._id}/import-results`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload CSV file');
      }

      setUploadStats(data);
      fetchData(); // Refresh list to see progression updates
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleBulkAction = async (actionType) => {
    if (selectedIds.length === 0) return;
    
    const confirmMsg = actionType === 'advance' 
      ? `Are you sure you want to promote these ${selectedIds.length} candidates to the next round?`
      : `Are you sure you want to reject these ${selectedIds.length} candidates?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const endpoint = actionType === 'advance' ? '/api/applications/bulk-advance' : '/api/applications/bulk-reject';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to perform bulk ${actionType}`);
      }

      alert(data.message || `Bulk ${actionType} completed successfully!`);
      setSelectedIds([]);
      fetchData(); // Refresh list
    } catch (err) {
      alert(err.message);
    }
  };

  const tabCounts = {
    screening: applicantList.filter(a => (filterDrive === 'All' || a.driveId === filterDrive) && a.status === 'In Progress' && a.isSystemStage).length,
    custom_stages: applicantList.filter(a => (filterDrive === 'All' || a.driveId === filterDrive) && a.status === 'In Progress' && !a.isSystemStage).length,
    selected: applicantList.filter(a => (filterDrive === 'All' || a.driveId === filterDrive) && a.status === 'Selected').length,
    rejected: applicantList.filter(a => (filterDrive === 'All' || a.driveId === filterDrive) && a.status === 'Rejected').length,
  };

  const filteredApplicants = applicantList.filter(a => {
    if (filterDrive !== 'All' && a.driveId !== filterDrive) return false;

    if (activeTab === 'screening') {
      return a.status === 'In Progress' && a.isSystemStage;
    } else if (activeTab === 'custom_stages') {
      return a.status === 'In Progress' && !a.isSystemStage;
    } else if (activeTab === 'selected') {
      return a.status === 'Selected';
    } else if (activeTab === 'rejected') {
      return a.status === 'Rejected';
    }
    return true;
  });

  if (loading && applicantList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-surface-400 text-sm">Loading applicants...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Applicants</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">{filteredApplicants.length} total applicants</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400 transition-colors" title="Refresh Data">
            <RefreshCw size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-surface-400" />
            <select value={filterDrive} onChange={e => setFilterDrive(e.target.value)} className="input-field !w-auto">
              <option value="All">All Drives</option>
              {drivesList.map(d => (
                <option key={d.id} value={d.id}>{d.role} ({d.companyName})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Helper Drive Pipeline Configurator (When no specific drive is selected) */}
      {filterDrive === 'All' && (
        <div className="glass-card p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-surface-900 dark:text-white">Configure Recruitment Pipelines</h2>
            <p className="text-xs text-surface-400 mt-0.5">Select a campus drive from the list below to create hiring stages and upload assessment results.</p>
          </div>
          {drivesList.length === 0 ? (
            <p className="text-xs text-surface-400 py-2">No active job posts found. Post a drive to design its recruitment rounds.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {drivesList.map(d => (
                <div key={d.id} className="p-4 rounded-xl border border-surface-150 dark:border-surface-750 bg-surface-50 dark:bg-surface-800/40 flex justify-between items-center hover:border-primary-500/30 dark:hover:border-primary-500/20 transition-all">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-surface-900 dark:text-white truncate">{d.role}</p>
                    <p className="text-[11px] text-surface-400 truncate">{d.companyName}</p>
                  </div>
                  <button 
                    onClick={() => setFilterDrive(d.id)}
                    className="btn-secondary !py-1.5 !px-3 !text-xs shrink-0 flex items-center gap-1 font-semibold"
                  >
                    Configure Pipeline <ChevronRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recruitment Stages Configurator (Only when a specific drive is selected) */}
      {filterDrive !== 'All' && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-700 pb-3 flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-surface-900 dark:text-white">Hiring Pipeline Stages</h2>
              <p className="text-xs text-surface-400 mt-0.5">Define steps and import external results (HackerRank, Mercer, etc.)</p>
            </div>
            <button 
              onClick={() => setIsAddStageOpen(true)}
              className="btn-primary flex items-center gap-1.5 !py-1.5 !text-xs"
            >
              <Plus size={14} /> Add Stage
            </button>
          </div>

          {stages.length === 0 ? (
            <div className="text-center py-6 text-surface-400 text-sm">
              <AlertCircle size={24} className="mx-auto mb-2 text-surface-300" />
              <p>No custom stages defined for this drive yet.</p>
              <p className="text-xs mt-0.5 text-surface-400/80">Applicants are marked "Applied" by default. Add stages to progress them.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stages.map((stg) => {
                const stageApplicants = applicantList.filter(a => a.currentStageId === stg._id && a.status === 'In Progress');
                return (
                  <div key={stg._id} className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-750 flex flex-col justify-between gap-3 hover:border-primary-500/30 dark:hover:border-primary-500/20 transition-all">
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-500 px-2 py-0.5 bg-primary-50 dark:bg-primary-950/20 rounded-md">
                          Stage {stg.stageOrder} ({stg.stageType})
                        </span>
                        {!stg.isSystemStage && (
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => {
                                setEditingStage(stg);
                                setStageAttachments([]);
                              }} 
                              className="p-1 rounded text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors"
                              title="Edit Stage"
                            >
                              <Edit size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteStage(stg._id)} 
                              className="p-1 rounded text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                              title="Delete Stage"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-surface-900 dark:text-white mt-2 leading-snug">{stg.stageName}</h3>
                      {stg.description && <p className="text-xs text-surface-400 mt-1 line-clamp-2">{stg.description}</p>}
                      {stg.attachments && stg.attachments.length > 0 ? (
                        <div className="space-y-1.5 mt-2">
                          {stg.attachments.map((att, idx) => (
                            <a 
                              key={idx}
                              href={att.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] font-semibold text-primary-500 hover:underline flex items-center gap-1"
                            >
                              <FileText size={11} className="text-primary-500 shrink-0" /> {att.fileName || `Material ${idx + 1}`}
                            </a>
                          ))}
                        </div>
                      ) : stg.attachmentUrl ? (
                        <a 
                          href={stg.attachmentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-primary-500 hover:underline flex items-center gap-1 mt-1.5"
                        >
                          <FileText size={11} className="text-primary-500" /> View Round Material
                        </a>
                      ) : null}
                      <p className="text-xs text-surface-500 mt-2 font-medium">Candidates here: <span className="text-primary-500 font-bold">{stageApplicants.length}</span></p>
                    </div>

                    {!stg.isSystemStage && (
                      <div className="pt-2 border-t border-surface-100 dark:border-surface-700 flex gap-2">
                        <button 
                          onClick={() => {
                            setActiveStageForUpload(stg);
                            setUploadStats(null);
                            setCsvFile(null);
                            setIsCsvUploadOpen(true);
                          }}
                          className="btn-secondary flex-1 flex items-center justify-center gap-1.5 !py-1.5 !text-[11px] font-semibold"
                        >
                          <UploadCloud size={13} /> Import CSV
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dynamic Tabs */}
      <div className="flex border-b border-surface-150 dark:border-surface-750 flex-wrap gap-1">
        {[
          { id: 'screening', label: 'Resume Screening Queue', count: tabCounts.screening },
          { id: 'custom_stages', label: 'Other Stages / In Progress', count: tabCounts.custom_stages },
          { id: 'selected', label: 'Selected', count: tabCounts.selected },
          { id: 'rejected', label: 'Rejected', count: tabCounts.rejected },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedIds([]); // Clear selection on tab switch
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-500 bg-primary-500/5'
                : 'border-transparent text-surface-450 hover:text-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800/25'
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === tab.id ? 'bg-primary-500 text-white' : 'bg-surface-250 dark:bg-surface-800 text-surface-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk Action Bar (For Resume Screening Tab) */}
      {activeTab === 'screening' && filteredApplicants.length > 0 && (
        <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="selectAll"
              checked={filteredApplicants.length > 0 && selectedIds.length === filteredApplicants.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(filteredApplicants.map(a => a.id));
                } else {
                  setSelectedIds([]);
                }
              }}
              className="rounded text-primary-500 focus:ring-primary-500 border-surface-300 h-4 w-4 cursor-pointer"
            />
            <label htmlFor="selectAll" className="text-xs font-semibold text-surface-600 dark:text-surface-300 cursor-pointer">
              Select All ({selectedIds.length} of {filteredApplicants.length} selected)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('advance')}
              disabled={selectedIds.length === 0}
              className="btn-primary flex items-center gap-1.5 !py-1.5 !text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserCheck size={14} /> Move To Next Round
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={selectedIds.length === 0}
              className="btn-danger flex items-center gap-1.5 !py-1.5 !text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserX size={14} /> Reject Selected
            </button>
          </div>
        </div>
      )}

      {/* Applicants List */}
      <div className="grid gap-3">
        {filteredApplicants.map(app => (
          <div key={app.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {activeTab === 'screening' && (
                <input 
                  type="checkbox"
                  checked={selectedIds.includes(app.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(prev => [...prev, app.id]);
                    } else {
                      setSelectedIds(prev => prev.filter(id => id !== app.id));
                    }
                  }}
                  className="rounded text-primary-500 focus:ring-primary-500 border-surface-300 h-4 w-4 shrink-0 cursor-pointer"
                />
              )}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {app.student?.name?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-surface-900 dark:text-white">{app.student?.name}</p>
                <p className="text-xs text-surface-400">{app.student?.branch} • CGPA: {app.student?.cgpa} • Batch: {app.student?.batch}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] bg-surface-100 dark:bg-surface-800 text-surface-500 font-semibold px-2 py-0.5 rounded-md">
                    {app.drive?.role}
                  </span>
                  <span className="text-[10px] bg-accent-50 dark:bg-accent-950/20 text-accent-600 dark:text-accent-400 font-bold px-2 py-0.5 rounded-md">
                    Round: {app.currentStage}
                  </span>
                  {app.statusReason && (
                    <span className="text-[10px] bg-red-50 dark:bg-red-950/10 text-red-500 px-2 py-0.5 rounded-md">
                      Reason: {app.statusReason}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={app.status} />
              <div className="flex items-center gap-1 ml-2">
                <button onClick={() => setSelectedStudent(app)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors" title="View Profile">
                  <Eye size={15} className="text-surface-500" />
                </button>
                {app.status === 'Applied' && (
                  <>
                    <button onClick={() => handleAction(app.id, 'Shortlisted')} className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors" title="Shortlist">
                      <UserCheck size={15} className="text-emerald-500" />
                    </button>
                    <button onClick={() => handleAction(app.id, 'Rejected')} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors" title="Reject">
                      <UserX size={15} className="text-red-500" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredApplicants.length === 0 && (
        <div className="text-center py-16 text-surface-400 glass-card">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No applicants found</p>
        </div>
      )}

      {/* Add Stage Modal */}
      <Modal isOpen={isAddStageOpen} onClose={() => setIsAddStageOpen(false)} title="Add Recruitment Stage">
        <form onSubmit={handleAddStage} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1">Stage Order</label>
            <input 
              type="number" 
              required 
              value={newStage.stageOrder}
              onChange={e => setNewStage(prev => ({ ...prev, stageOrder: parseInt(e.target.value) }))}
              className="input-field"
              min="1"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1">Stage Name</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Mercer Mettl Online Assessment" 
              value={newStage.stageName}
              onChange={e => setNewStage(prev => ({ ...prev, stageName: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1">Round Category</label>
            <select 
              value={newStage.stageType}
              onChange={e => {
                const type = e.target.value;
                setNewStage(prev => ({ 
                  ...prev, 
                  stageType: type,
                  stageName: type
                }));
              }}
              className="input-field"
            >
              <option value="Resume Screening">Resume Screening</option>
              <option value="Online Assessment">Online Assessment</option>
              <option value="Technical Interview">Technical Interview</option>
              <option value="HR Interview">HR Interview</option>
              <option value="Group Discussion">Group Discussion</option>
              <option value="Assignment">Assignment</option>
              <option value="Document Verification">Document Verification</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1">Description</label>
            <textarea 
              placeholder="Provide directions or testing details..." 
              value={newStage.description}
              onChange={e => setNewStage(prev => ({ ...prev, description: e.target.value }))}
              className="input-field min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1">Stage Guidelines / Syllabus Attachments (Optional)</label>
            <input 
              type="file" 
              multiple
              onChange={e => {
                const selectedFiles = Array.from(e.target.files);
                setStageAttachments(prev => [...prev, ...selectedFiles]);
                e.target.value = '';
              }}
              className="input-field !py-1.5 text-xs text-surface-400 mb-2"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
            />
            {stageAttachments.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {stageAttachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-surface-100 dark:bg-surface-800/60 border border-surface-150 dark:border-surface-700">
                    <span className="text-[10px] text-surface-650 dark:text-surface-300 flex items-center gap-1.5 truncate pr-2">
                      <FileText size={12} className="shrink-0 text-surface-400" /> {file.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Replace button for queued file */}
                      <label className="p-1 rounded text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors cursor-pointer" title="Replace file">
                        <RefreshCw size={13} className="text-primary-500" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              const newFile = e.target.files[0];
                              setStageAttachments(prev => prev.map((f, i) => i === idx ? newFile : f));
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setStageAttachments(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        title="Remove file"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-surface-400 mt-1">Accepts multiple PDF, Word docs, and Images (Max 10MB each)</p>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isFinalStage"
              checked={newStage.isFinalStage}
              onChange={e => setNewStage(prev => ({ ...prev, isFinalStage: e.target.checked }))}
              className="rounded text-primary-500 focus:ring-primary-500 border-surface-300 h-4 w-4"
            />
            <label htmlFor="isFinalStage" className="text-xs font-semibold text-surface-600 dark:text-surface-300">Is this the final stage? (Passing marks student Selected)</label>
          </div>
          <div className="flex gap-3 justify-end pt-3">
            <button type="button" onClick={() => setIsAddStageOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Stage</button>
          </div>
        </form>
      </Modal>

      {/* Edit Stage Modal */}
      <Modal isOpen={!!editingStage} onClose={() => setEditingStage(null)} title="Edit Recruitment Stage">
        {editingStage && (
          <form onSubmit={handleEditStage} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1">Stage Order</label>
              <input 
                type="number" 
                required 
                value={editingStage.stageOrder}
                onChange={e => setEditingStage(prev => ({ ...prev, stageOrder: parseInt(e.target.value) }))}
                className="input-field"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1">Stage Name</label>
              <input 
                type="text" 
                required 
                value={editingStage.stageName}
                onChange={e => setEditingStage(prev => ({ ...prev, stageName: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1">Round Category</label>
              <select 
                value={editingStage.stageType}
                onChange={e => {
                  const type = e.target.value;
                  setEditingStage(prev => ({ 
                    ...prev, 
                    stageType: type,
                    stageName: type
                  }));
                }}
                className="input-field"
              >
                <option value="Resume Screening">Resume Screening</option>
                <option value="Online Assessment">Online Assessment</option>
                <option value="Technical Interview">Technical Interview</option>
                <option value="HR Interview">HR Interview</option>
                <option value="Group Discussion">Group Discussion</option>
                <option value="Assignment">Assignment</option>
                <option value="Document Verification">Document Verification</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1">Description</label>
              <textarea 
                placeholder="Provide directions or testing details..." 
                value={editingStage.description || ''}
                onChange={e => setEditingStage(prev => ({ ...prev, description: e.target.value }))}
                className="input-field min-h-[80px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1">Current Attachments</label>
              {((editingStage.attachments && editingStage.attachments.length > 0) || editingStage.attachmentUrl) ? (
                <div className="space-y-1.5 mb-3">
                  {editingStage.attachments && editingStage.attachments.length > 0 ? (
                    editingStage.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-surface-100 dark:bg-surface-800/60 border border-surface-150 dark:border-surface-700">
                        <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary-500 hover:underline flex items-center gap-1.5 truncate pr-2">
                          <FileText size={13} className="shrink-0" /> {att.fileName || `Material ${idx + 1}`}
                        </a>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Replace Button */}
                          <label className="p-1 rounded text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors cursor-pointer" title="Replace file">
                            <RefreshCw size={13} className="text-primary-500" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                              onChange={e => {
                                if (e.target.files && e.target.files[0]) {
                                  const newFile = e.target.files[0];
                                  setStageAttachments(prev => [...prev, newFile]);
                                  setEditingStage(prev => ({
                                    ...prev,
                                    attachments: prev.attachments.filter((_, i) => i !== idx)
                                  }));
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <button 
                            type="button" 
                            onClick={() => {
                              setEditingStage(prev => ({
                                ...prev,
                                attachments: prev.attachments.filter((_, i) => i !== idx)
                              }));
                            }}
                            className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Delete file"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-100 dark:bg-surface-800/60 border border-surface-150 dark:border-surface-700">
                      <a href={editingStage.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary-500 hover:underline flex items-center gap-1.5 truncate pr-2">
                        <FileText size={13} className="shrink-0" /> View Current Attachment
                      </a>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Replace Button for Legacy attachment */}
                        <label className="p-1 rounded text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors cursor-pointer" title="Replace file">
                          <RefreshCw size={13} className="text-primary-500" />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                const newFile = e.target.files[0];
                                setStageAttachments(prev => [...prev, newFile]);
                                setEditingStage(prev => ({
                                  ...prev,
                                  attachmentUrl: ''
                                }));
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingStage(prev => ({
                              ...prev,
                              attachmentUrl: ''
                            }));
                          }}
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Delete file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-surface-400 mb-2 italic text-center py-2 bg-surface-100/50 dark:bg-surface-800/30 rounded-lg">No files currently attached</p>
              )}
              
              <label className="block text-xs font-semibold text-surface-500 mb-1">Upload More Attachments (Optional)</label>
              <input 
                type="file" 
                multiple
                onChange={e => {
                  const selectedFiles = Array.from(e.target.files);
                  setStageAttachments(prev => [...prev, ...selectedFiles]);
                  e.target.value = '';
                }}
                className="input-field !py-1.5 text-xs text-surface-400 mb-2"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
              />
              {stageAttachments.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {stageAttachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-surface-100 dark:bg-surface-800/60 border border-surface-150 dark:border-surface-700">
                      <span className="text-[10px] text-surface-650 dark:text-surface-300 flex items-center gap-1.5 truncate pr-2">
                        <FileText size={12} className="shrink-0 text-surface-400" /> {file.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Replace button for queued new file */}
                        <label className="p-1 rounded text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors cursor-pointer" title="Replace file">
                          <RefreshCw size={13} className="text-primary-500" />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                const newFile = e.target.files[0];
                                setStageAttachments(prev => prev.map((f, i) => i === idx ? newFile : f));
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => {
                            setStageAttachments(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Remove file"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-surface-400 mt-1">Select one or more files to add to this stage (Max 10MB each)</p>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="editIsFinalStage"
                checked={editingStage.isFinalStage}
                onChange={e => setEditingStage(prev => ({ ...prev, isFinalStage: e.target.checked }))}
                className="rounded text-primary-500 focus:ring-primary-500 border-surface-300 h-4 w-4"
              />
              <label htmlFor="editIsFinalStage" className="text-xs font-semibold text-surface-600 dark:text-surface-300">Is this the final stage? (Passing marks student Selected)</label>
            </div>
            <div className="flex gap-3 justify-end pt-3">
              <button type="button" onClick={() => setEditingStage(null)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      {/* CSV Result Upload Modal */}
      <Modal isOpen={isCsvUploadOpen} onClose={() => setIsCsvUploadOpen(false)} title={`Upload Results: ${activeStageForUpload?.stageName}`}>
        {!uploadStats ? (
          <form onSubmit={handleCsvUpload} className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700/50 space-y-2">
              <p className="text-xs font-semibold text-surface-650">Required CSV Format:</p>
              <code className="block text-xs font-mono bg-surface-150 dark:bg-surface-900 p-2.5 rounded-lg text-primary-500 dark:text-primary-400">
                email,result<br/>
                student1@crms.com,PASS<br/>
                student2@crms.com,FAIL<br/>
              </code>
              <p className="text-[10px] text-surface-400 mt-1">Passing candidates automatically advance to the next round. Failing candidates are marked Rejected with reason "Failed {activeStageForUpload?.stageName}".</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1.5">Choose CSV File</label>
              <input 
                type="file" 
                required
                accept=".csv"
                onChange={e => setCsvFile(e.target.files[0])}
                className="block w-full text-xs text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-950/20 dark:file:text-primary-400"
              />
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <button type="button" onClick={() => setIsCsvUploadOpen(false)} className="btn-secondary" disabled={uploading}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Processing CSV...' : 'Process Results'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Processed', value: uploadStats.processed, color: 'text-surface-900 dark:text-white' },
                { label: 'Promoted', value: uploadStats.promoted, color: 'text-emerald-500' },
                { label: 'Rejected', value: uploadStats.rejected, color: 'text-red-500' },
                { label: 'Skipped', value: uploadStats.skipped, color: 'text-amber-500' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-750 text-center">
                  <p className="text-xs text-surface-400">{item.label}</p>
                  <p className={`font-bold text-lg mt-0.5 ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {uploadStats.errors && uploadStats.errors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-red-500">Errors & Warnings:</p>
                <div className="max-h-[160px] overflow-y-auto p-3 rounded-xl border border-red-100 dark:border-red-950/20 bg-red-50/20 dark:bg-red-950/5 font-mono text-[10px] text-red-600 dark:text-red-400 space-y-1">
                  {uploadStats.errors.map((err, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="shrink-0">•</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setIsCsvUploadOpen(false)} className="btn-primary w-full mt-2">
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* Student Detail Modal */}
      <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Applicant Details" size="md">
        {selectedStudent?.student && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-lg shrink-0">
                {selectedStudent.student.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-surface-900 dark:text-white text-lg leading-tight">{selectedStudent.student.name}</p>
                <p className="text-sm text-surface-500">{selectedStudent.student.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Branch', value: selectedStudent.student.branch },
                { label: 'CGPA', value: selectedStudent.student.cgpa },
                { label: 'Phone', value: selectedStudent.student.phone },
                { label: 'Semester', value: selectedStudent.student.semester },
                { label: 'Batch', value: selectedStudent.student.batch },
                { label: 'Backlogs', value: selectedStudent.student.backlogs },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                  <p className="text-xs text-surface-400">{item.label}</p>
                  <p className="font-semibold text-surface-900 dark:text-white text-sm mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            <div>
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Profiles & Attachments</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-150 dark:border-surface-700/50 flex flex-col justify-between">
                  <p className="text-xs text-surface-400">LinkedIn Profile</p>
                  {selectedStudent.student.linkedinUrl ? (
                    <a href={selectedStudent.student.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 hover:underline font-semibold mt-1 truncate block">
                      {selectedStudent.student.linkedinUrl}
                    </a>
                  ) : (
                    <p className="text-xs text-surface-400 italic mt-1">Not Provided</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-150 dark:border-surface-700/50 flex flex-col justify-between">
                  <p className="text-xs text-surface-400">GitHub Profile</p>
                  {selectedStudent.student.githubUrl ? (
                    <a href={selectedStudent.student.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 hover:underline font-semibold mt-1 truncate block">
                      {selectedStudent.student.githubUrl}
                    </a>
                  ) : (
                    <p className="text-xs text-surface-400 italic mt-1">Not Provided</p>
                  )}
                </div>
              </div>
            </div>
            {selectedStudent.student.skills && selectedStudent.student.skills.length > 0 && (
              <div>
                <p className="text-xs text-surface-400 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.student.skills.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-lg">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedStudent.student.projects && selectedStudent.student.projects.length > 0 && (
              <div>
                <p className="text-xs text-surface-400 mb-2 flex items-center gap-1.5"><BookOpen size={14} /> Projects</p>
                <div className="space-y-2">
                  {selectedStudent.student.projects.map((p, i) => (
                    <div key={i} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/30 border border-surface-100 dark:border-surface-700/50">
                      <p className="font-semibold text-xs text-surface-950 dark:text-white">{p.title}</p>
                      <p className="text-[11px] text-surface-400 mt-1">{p.description}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[9px] text-primary-500 font-semibold">Tech: {p.tech}</span>
                        {p.projectUrl && (
                          <a
                            href={p.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-accent-500 hover:underline font-bold"
                          >
                            Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedStudent.student.resume && (
              <button 
                onClick={() => window.open(selectedStudent.student.resume, '_blank')}
                className="btn-secondary w-full"
              >
                <FileText size={14} /> View Resume PDF
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
