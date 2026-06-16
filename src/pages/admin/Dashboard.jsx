import { useState, useEffect } from 'react';
import DashboardCard from '../../components/shared/DashboardCard';
import StatusBadge from '../../components/shared/StatusBadge';
import { GraduationCap, Building2, Briefcase, FileText, TrendingUp, Users, ChevronRight, Award } from 'lucide-react';


const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [recruitersCount, setRecruitersCount] = useState(0);
  const [studentCountsByBatch, setStudentCountsByBatch] = useState({});
  const [loadingStats, setLoadingStats] = useState(true);

  // Inspector State
  const [selectedDriveId, setSelectedDriveId] = useState('All');
  const [selectedDriveStages, setSelectedDriveStages] = useState([]);
  const [loadingStages, setLoadingStages] = useState(false);

  const token = localStorage.getItem('crms_token');

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      
      const [batchesRes, studentsRes, drivesRes, appsRes, recruitersRes] = await Promise.all([
        fetch('/api/admin/batches', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/students', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/drives', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/applications', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/recruiters', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const [batchesData, studentsData, drivesData, appsData, recruitersData] = await Promise.all([
        batchesRes.json(),
        studentsRes.json(),
        drivesRes.json(),
        appsRes.json(),
        recruitersRes.json()
      ]);
      
      if (drivesRes.ok) setDrives(drivesData.data || []);
      if (appsRes.ok) setApplications(appsData.data || []);
      if (recruitersRes.ok) setRecruitersCount(recruitersData.data ? recruitersData.data.length : 0);

      if (studentsRes.ok && studentsData.data) {
        const counts = {};
        
        if (batchesRes.ok && batchesData.data) {
          batchesData.data.forEach(b => {
            const canonical = b.canonicalBatch || `${b.startYear}-${b.endYear}`;
            counts[canonical] = {
              name: b.batchName,
              count: 0
            };
          });
        }
        
        studentsData.data.forEach(student => {
          const batchVal = student.batch || 'Unassigned';
          if (counts[batchVal]) {
            counts[batchVal].count += 1;
          } else {
            counts[batchVal] = {
              name: batchVal,
              count: (counts[batchVal]?.count || 0) + 1
            };
          }
        });
        
        setStudentCountsByBatch(counts);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard student stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch stages for the selected drive when it changes
  useEffect(() => {
    const fetchStages = async () => {
      if (selectedDriveId === 'All') {
        setSelectedDriveStages([]);
        return;
      }
      try {
        setLoadingStages(true);
        const res = await fetch(`/api/drives/${selectedDriveId}/stages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setSelectedDriveStages(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching drive stages:', err);
      } finally {
        setLoadingStages(false);
      }
    };
    fetchStages();
  }, [selectedDriveId]);

  // Aggregate selected drive pipeline stats
  const getSelectedDriveStats = () => {
    const validApps = (applications || []).filter(a => a != null);

    const driveApps = selectedDriveId === 'All' 
      ? validApps 
      : validApps.filter(a => a.driveId && (a.driveId._id === selectedDriveId || a.driveId === selectedDriveId));

    const total = driveApps.length;
    const selected = driveApps.filter(a => (a.pipelineStatus || a.status) === 'Selected').length;
    const rejected = driveApps.filter(a => (a.pipelineStatus || a.status) === 'Rejected').length;
    const inProgress = driveApps.filter(a => (a.pipelineStatus || a.status) === 'In Progress').length;
    const applied = driveApps.filter(a => (a.pipelineStatus || a.status) === 'Applied').length;

    // Candidates in each stage
    const stageCounts = {};
    (selectedDriveStages || []).filter(Boolean).forEach(s => {
      stageCounts[s._id] = {
        name: s.stageName,
        type: s.stageType,
        order: s.stageOrder,
        count: 0
      };
    });

    driveApps.forEach(a => {
      if (a.currentStageId) {
        const stageId = a.currentStageId._id || a.currentStageId;
        if (stageCounts[stageId]) {
          stageCounts[stageId].count += 1;
        }
      }
    });

    return {
      total,
      selected,
      rejected,
      inProgress,
      applied,
      stages: Object.values(stageCounts).sort((a, b) => a.order - b.order)
    };
  };

  const pipeStats = getSelectedDriveStats();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Campus Recruitment Overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? (
          <div className="glass-card p-6 flex items-center justify-center col-span-1 min-h-[120px]">
            <span className="text-sm text-surface-400">Loading student batches...</span>
          </div>
        ) : Object.keys(studentCountsByBatch).length > 0 ? (
          Object.entries(studentCountsByBatch).map(([batchVal, item]) => (
            <DashboardCard
              key={batchVal}
              title={batchVal === 'Unassigned' ? 'Students (Unassigned)' : `Students (${item.name})`}
              value={item.count}
              icon={GraduationCap}
              color="primary"
            />
          ))
        ) : (
          <DashboardCard title="Students" value={0} icon={GraduationCap} color="primary" />
        )}
        <DashboardCard title="Total Recruiters" value={recruitersCount} icon={Building2} color="accent" />
        <DashboardCard title="Total Drives" value={drives.length} icon={Briefcase} color="success" />
        <DashboardCard title="Total Applications" value={applications.length} icon={FileText} color="warning" />
      </div>

      {/* Recruitment Pipeline Progress Section */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-150 dark:border-surface-700 pb-3 flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-500" /> Recruitment Pipeline Progress
            </h3>
            <p className="text-xs text-surface-400 mt-0.5">Observe dynamic candidate counts and stages per campus drive</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-500 font-semibold">Select Drive:</span>
            <select 
              value={selectedDriveId} 
              onChange={e => setSelectedDriveId(e.target.value)} 
              className="input-field !w-auto !py-1 !px-2.5 !text-xs"
            >
              <option value="All">All Active Drives</option>
              {(drives || []).filter(Boolean).map(d => (
                <option key={d._id} value={d._id}>{d.companyName} - {d.role}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Progress / Stage Breakdown List */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-surface-900 dark:text-white uppercase tracking-wider">Stages Candidates distribution</h4>
            
            {selectedDriveId === 'All' ? (
              <div className="p-5 rounded-xl bg-surface-50 dark:bg-surface-800/50 text-center text-xs text-surface-400">
                Select a specific campus drive to inspect stages distribution.
              </div>
            ) : loadingStages ? (
              <div className="p-5 rounded-xl bg-surface-50 dark:bg-surface-800/50 text-center text-xs text-surface-400">
                Loading drive stages...
              </div>
            ) : selectedDriveStages.length === 0 ? (
              <div className="p-5 rounded-xl bg-surface-50 dark:bg-surface-800/50 text-center text-xs text-surface-400">
                No custom recruitment stages configured for this drive.
              </div>
            ) : (
              <div className="space-y-2">
                {pipeStats.stages.map((stg) => {
                  const percentage = pipeStats.total > 0 ? (stg.count / pipeStats.total) * 100 : 0;
                  return (
                    <div key={stg.name} className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/30 border border-surface-100 dark:border-surface-700/50 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold text-surface-900 dark:text-white">Stage {stg.order}: {stg.name}</span>
                          <span className="text-[10px] ml-2 text-primary-500 font-semibold uppercase">{stg.type}</span>
                        </div>
                        <span className="font-bold text-surface-900 dark:text-white">{stg.count} candidates</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drive Selection Stats Summary */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-surface-900 dark:text-white uppercase tracking-wider">Hiring Statistics</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Applied', value: pipeStats.total, color: 'text-surface-900 dark:text-white' },
                { label: 'In Progress', value: pipeStats.inProgress, color: 'text-purple-500' },
                { label: 'Selected', value: pipeStats.selected, color: 'text-emerald-500' },
                { label: 'Rejected', value: pipeStats.rejected, color: 'text-red-500' }
              ].map(stat => (
                <div key={stat.label} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/55 border border-surface-100 dark:border-surface-700 text-center">
                  <p className="text-[10px] text-surface-400 font-semibold uppercase">{stat.label}</p>
                  <p className={`text-lg font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
