import { useState, useEffect } from 'react';
import StatusBadge from '../../components/shared/StatusBadge';
import { CheckCircle, Circle, Clock, XCircle, FileText } from 'lucide-react';

const statusSteps = ['Applied', 'Resume Screening', 'Selected'];

function ProgressTracker({ currentStatus, isRejected, stages = [], currentStage }) {
  let steps = ['Applied', 'Resume Screening', 'Selected'];
  let stepIndex = 0;
  let failedIndex = -1;

  if (stages && stages.length > 0) {
    const stageNames = stages.map(s => s.stageName);
    steps = ['Applied', ...stageNames, 'Selected'];

    if (currentStatus === 'Applied') {
      stepIndex = 0;
    } else if (currentStatus === 'Selected') {
      stepIndex = steps.length - 1;
    } else {
      const sIdx = stageNames.indexOf(currentStage);
      if (sIdx !== -1) {
        stepIndex = 1 + sIdx;
      } else {
        stepIndex = 1;
      }
      
      if (currentStatus === 'Rejected') {
        failedIndex = stepIndex;
      }
    }
  } else {
    const mappedStatus = currentStatus === 'Rejected' ? 'Resume Screening' : currentStatus;
    stepIndex = ['Applied', 'Resume Screening', 'Selected'].indexOf(mappedStatus);
    if (currentStatus === 'Rejected') {
      failedIndex = 1;
    }
  }

  return (
    <div className="flex items-center gap-1 mt-4 flex-wrap sm:flex-nowrap">
      {steps.map((step, i) => {
        const isFailedStep = i === failedIndex && isRejected;
        const isPassedStep = i < stepIndex && !isRejected;
        const isCurrentActiveStep = i === stepIndex && !isRejected;

        return (
          <div key={`${step}-${i}`} className="flex items-center flex-1 min-w-[70px]">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isFailedStep ? 'bg-red-100 dark:bg-red-900/20 text-red-500 border border-red-500' :
                isPassedStep ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30' :
                isCurrentActiveStep ? 'bg-accent-500 text-white shadow-md shadow-accent-500/30 ring-2 ring-accent-400' :
                'bg-surface-200 dark:bg-surface-700 text-surface-400'
              }`}>
                {isFailedStep ? <XCircle size={14} /> :
                 (isPassedStep || isCurrentActiveStep) ? <CheckCircle size={14} /> : <Circle size={14} />}
              </div>
              <span className={`text-[9px] mt-1 text-center font-semibold leading-tight px-1 ${
                isCurrentActiveStep ? 'text-accent-500 font-bold' : 
                isFailedStep ? 'text-red-500 font-bold' : 
                isPassedStep ? 'text-primary-500' : 'text-surface-400'
              }`}>{isFailedStep ? `Failed: ${step}` : step}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 -mt-4 mx-0.5 rounded ${
                i < stepIndex && !isRejected ? 'bg-primary-500' : 'bg-surface-200 dark:bg-surface-700'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MyApplications() {
  const [appsList, setAppsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const token = localStorage.getItem('crms_token');

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/applications/my', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch applications');
      }

      const mapped = (data.data.applications || []).map(a => ({
        id: a._id,
        status: a.pipelineStatus || a.status,
        appliedDate: a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : 'N/A',
        company: a.driveId?.companyName || 'Unknown Company',
        role: a.driveId?.role || 'Unknown Role',
        package: a.driveId?.packageOffered || 'N/A',
        currentStage: a.currentStageId ? a.currentStageId.stageName : null,
        statusReason: a.statusReason || '',
        stages: a.stages || [],
      }));
      setAppsList(mapped);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const filteredApps = appsList.filter(a => {
    if (activeFilter === 'All') return true;
    return a.status === activeFilter;
  });

  if (loading && appsList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-surface-400 text-sm">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">My Applications</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Track all your placement applications</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Summary Bar / Filters */}
      <div className="flex flex-wrap gap-3">
        {['All', 'Applied', 'In Progress', 'Selected', 'Rejected'].map(status => {
          const count = status === 'All' ? appsList.length : appsList.filter(a => a.status === status).length;
          const isActive = activeFilter === status;
          return (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border border-transparent ${
                isActive
                  ? 'bg-primary-500 text-white shadow-sm ring-2 ring-primary-400/20'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
              }`}
            >
              {status}
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-surface-250 dark:bg-surface-700 text-surface-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Application Cards */}
      <div className="space-y-4">
        {filteredApps.map(app => (
          <div key={app.id} className="glass-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-surface-900 dark:text-white">{app.company}</h3>
                <p className="text-sm text-primary-500 font-medium">{app.role}</p>
                <p className="text-xs text-surface-400 mt-1">{app.package}</p>
                {app.currentStage && app.status !== 'Selected' && (
                  <p className="text-xs font-semibold text-accent-500 mt-2 bg-accent-50 dark:bg-accent-900/10 px-2.5 py-1 rounded-md inline-block">
                    Current Stage: {app.currentStage}
                  </p>
                )}
                {app.status === 'Rejected' && app.statusReason && (
                  <p className="text-xs text-red-500 mt-2 bg-red-50 dark:bg-red-900/10 px-2.5 py-1 rounded-md inline-block ml-2">
                    Reason: {app.statusReason}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={app.status} />
                <div className="text-right">
                  <p className="text-[10px] text-surface-400">Applied</p>
                  <p className="text-xs text-surface-600 dark:text-surface-300 font-medium">{app.appliedDate}</p>
                </div>
              </div>
            </div>
            <ProgressTracker 
              currentStatus={app.status} 
              isRejected={app.status === 'Rejected'} 
              stages={app.stages} 
              currentStage={app.currentStage} 
            />
            {app.status === 'Selected' ? (
              <div className="mt-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 space-y-1 animate-scale-in">
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" /> Selection Status: Selected
                </span>
                <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed font-semibold">
                  Congratulations! You have been selected for this role. Your offer letter will be sent to you soon via email.
                </p>
              </div>
            ) : (
              app.currentStage && app.stages && app.stages.length > 0 && (
                (() => {
                  const currentStageObj = app.stages.find(s => s.stageName === app.currentStage);
                  if (currentStageObj && (currentStageObj.description || currentStageObj.attachmentUrl)) {
                    return (
                      <div className="mt-4 p-4 rounded-xl border border-primary-500/20 bg-primary-500/5 dark:bg-primary-950/10 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-bold text-primary-500 flex items-center gap-1.5">
                            <CheckCircle size={14} className="text-primary-500" /> Current Round Guidelines: {app.currentStage}
                          </span>
                          {currentStageObj.attachments && currentStageObj.attachments.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {currentStageObj.attachments.map((att, idx) => (
                                <a 
                                  key={idx}
                                  href={att.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-secondary !py-1 !px-2.5 !text-[10px] font-bold flex items-center gap-1 bg-white dark:bg-surface-800 shadow-sm"
                                >
                                  <FileText size={12} className="shrink-0 text-primary-500" /> {att.fileName || `Download Material ${idx + 1}`}
                                </a>
                              ))}
                            </div>
                          ) : currentStageObj.attachmentUrl ? (
                            <a 
                              href={currentStageObj.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary !py-1 !px-2.5 !text-[10px] font-bold flex items-center gap-1 bg-white dark:bg-surface-800"
                            >
                              <FileText size={12} /> Download Round Material
                            </a>
                          ) : null}
                        </div>
                      {currentStageObj.description && (
                        <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed font-medium">
                          {currentStageObj.description}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              })()
            )
          )}
        </div>
        ))}
      </div>

      {filteredApps.length === 0 && (
        <div className="text-center py-16 text-surface-400 glass-card">
          <Clock size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {appsList.length === 0 ? 'No applications yet' : 'No matching applications found'}
          </p>
          <p className="text-sm mt-1">
            {appsList.length === 0 
              ? 'Browse available drives to start applying' 
              : `You do not have any applications with the status "${activeFilter}"`}
          </p>
        </div>
      )}
    </div>
  );
}
