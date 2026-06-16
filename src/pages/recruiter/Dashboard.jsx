import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../../components/shared/DashboardCard';
import StatusBadge from '../../components/shared/StatusBadge';
import { Briefcase, Users, UserCheck, UserX, Calendar, FileText } from 'lucide-react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function RecruiterDashboard() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('crms_token');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch drives
      const drivesRes = await fetch('/api/drives/my', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const drivesData = await drivesRes.json();
      if (!drivesRes.ok) {
        throw new Error(drivesData.message || 'Failed to fetch drives');
      }

      // 2. Fetch applications
      const appsRes = await fetch('/api/applications/recruiter', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const appsData = await appsRes.json();
      if (!appsRes.ok) {
        throw new Error(appsData.message || 'Failed to fetch applicants');
      }

      setDrives(drivesData.data || []);
      setApplications(appsData.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const activeJobsCount = drives.filter(d => d.status === 'Published').length;
  const totalApplicants = applications.length;

  const selectedCount = applications.filter(a => {
    const s = a.pipelineStatus || a.status;
    return s === 'Selected';
  }).length;

  const rejectedCount = applications.filter(a => {
    const s = a.pipelineStatus || a.status;
    return s === 'Rejected';
  }).length;

  const resumeScreeningCount = applications.filter(a => {
    const s = a.pipelineStatus || a.status;
    if (s === 'Selected' || s === 'Rejected') return false;
    const isStage0 = !a.currentStageId || a.currentStageId.stageOrder === 0 || a.currentStageId.isSystemStage === true;
    return isStage0;
  }).length;

  const inProcessCount = applications.filter(a => {
    const s = a.pipelineStatus || a.status;
    if (s === 'Selected' || s === 'Rejected') return false;
    const isCustomStage = a.currentStageId && a.currentStageId.stageOrder !== 0 && !a.currentStageId.isSystemStage;
    return isCustomStage;
  }).length;

  const recentApplicants = applications.slice(0, 5).map(app => {
    const student = app.studentProfileId || {};
    const userObj = student.userId || {};
    return {
      id: app._id,
      studentName: userObj.fullName || 'Unknown Student',
      branch: student.branch || 'Not Profiled',
      cgpa: student.cgpa != null ? student.cgpa : '—',
      role: app.driveId?.role || 'Unknown Role',
      status: app.pipelineStatus || app.status,
    };
  });

  // Calculate dynamic status breakdown for PieChart
  const statusCounts = {
    'Resume Screening': resumeScreeningCount,
    'In Process': inProcessCount,
    'Selected': selectedCount,
    'Rejected': rejectedCount,
  };

  const statusBreakdown = [
    { name: 'Resume Screening', value: statusCounts['Resume Screening'], color: '#3b82f6' },
    { name: 'In Process', value: statusCounts['In Process'], color: '#8b5cf6' },
    { name: 'Selected', value: statusCounts.Selected, color: '#22c55e' },
    { name: 'Rejected', value: statusCounts.Rejected, color: '#ef4444' },
  ].filter(b => b.value > 0);

  // Calculate applicants per stage
  const stageCounts = {};
  applications.forEach(a => {
    const s = a.pipelineStatus || a.status;
    if (s !== 'Selected' && s !== 'Rejected') {
      const name = a.currentStageId?.stageName || 'Resume Screening';
      stageCounts[name] = (stageCounts[name] || 0) + 1;
    }
  });

  if (loading && drives.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-surface-400 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Welcome back 👋
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Recruiter Dashboard Overview</p>
      </div>

      {/* Quick Action banner for Recruitment Pipelines */}
      <div className="glass-card p-4 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-surface-900 dark:text-white text-sm">Hiring Pipeline Stages</h4>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Customize hiring stages (Online Assessment, Interview rounds) and upload CSV results to automatically progress students.</p>
        </div>
        <button 
          onClick={() => navigate('/recruiter/applicants')}
          className="btn-primary !py-1.5 !px-4 !text-xs whitespace-nowrap self-start sm:self-center font-semibold"
        >
          Configure Pipelines
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard title="Total Applicants" value={totalApplicants} icon={Users} color="primary" />
        <DashboardCard title="Resume Screening" value={resumeScreeningCount} icon={FileText} color="warning" />
        <DashboardCard title="In Process" value={inProcessCount} icon={Briefcase} color="accent" />
        <DashboardCard title="Rejected" value={rejectedCount} icon={UserX} color="danger" />
        <DashboardCard title="Selected" value={selectedCount} icon={UserCheck} color="success" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Candidates In Progress per Stage */}
        <div className="lg:col-span-2 glass-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-primary-500" /> Candidates In Progress per Stage
            </h3>
            {Object.keys(stageCounts).length === 0 ? (
              <p className="text-sm text-surface-400 py-8 text-center bg-surface-50 dark:bg-surface-800/30 rounded-xl border border-dashed border-surface-200 dark:border-surface-700">
                No candidates currently in progress stages.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(stageCounts).map(([stageName, count]) => (
                  <div key={stageName} className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/30 border border-surface-100 dark:border-surface-700/50 flex items-center justify-between">
                    <span className="font-semibold text-xs text-surface-700 dark:text-surface-300">{stageName}</span>
                    <span className="px-2.5 py-1 text-xs font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg border border-primary-500/20">
                      {count} {count === 1 ? 'candidate' : 'candidates'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-surface-900 dark:text-white mb-4">Application Status</h3>
          {statusBreakdown.length === 0 ? (
            <div className="text-center py-12 text-surface-400 text-sm">No applicant data available</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '0.75rem', color: '#fff', fontSize: '0.8125rem' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusBreakdown.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-surface-600 dark:text-surface-400">{s.name}</span>
                    </div>
                    <span className="font-semibold text-surface-900 dark:text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Applicants */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-surface-900 dark:text-white mb-4">Recent Applicants</h3>
        <div className="overflow-x-auto">
          {recentApplicants.length === 0 ? (
            <div className="text-center py-8 text-surface-400 text-sm">No recent applicants yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-surface-500 uppercase">Student</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-surface-500 uppercase">Branch</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-surface-500 uppercase">CGPA</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-surface-500 uppercase">Role</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-surface-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentApplicants.map(app => (
                  <tr key={app.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                    <td className="px-3 py-3 text-sm font-medium text-surface-900 dark:text-white">{app.studentName}</td>
                    <td className="px-3 py-3 text-sm text-surface-600 dark:text-surface-400">{app.branch}</td>
                    <td className="px-3 py-3 text-sm text-surface-600 dark:text-surface-400">{app.cgpa}</td>
                    <td className="px-3 py-3 text-sm text-surface-600 dark:text-surface-400">{app.role}</td>
                    <td className="px-3 py-3"><StatusBadge status={app.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
