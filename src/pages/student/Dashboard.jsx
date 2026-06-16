import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import DashboardCard from '../../components/shared/DashboardCard';
import StatusBadge from '../../components/shared/StatusBadge';
import { FileText, Briefcase, CheckCircle, Award, Bell, Info, TrendingUp } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    applications: [],
    eligibleCount: 0,
    notifications: [],
    profile: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('crms_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch applications, eligible drives, notifications, and student profile in parallel
        const [appsRes, eligibleRes, notifRes, profileRes] = await Promise.all([
          fetch('/api/applications/my', { headers }),
          fetch('/api/student/eligible-drives', { headers }),
          fetch('/api/notifications', { headers }),
          fetch('/api/student/profile', { headers })
        ]);

        let apps = [];
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          apps = appsData.data.applications || [];
        }

        let eligibleCount = 0;
        if (eligibleRes.ok) {
          const eligibleData = await eligibleRes.json();
          eligibleCount = eligibleData.data.total || eligibleData.data.drives?.length || 0;
        }

        let notifs = [];
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          notifs = notifData.data || [];
        }

        let profile = null;
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          profile = profileData.data || null;
        }

        setDashboardData({
          applications: apps,
          eligibleCount,
          notifications: notifs,
          profile
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
        setError('Failed to load dashboard statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-surface-400">Loading dashboard statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
        <Info size={18} />
        <span>{error}</span>
      </div>
    );
  }

  const { applications, eligibleCount, notifications, profile } = dashboardData;

  // Metric computations
  const totalApps = applications.length;
  const activeApps = applications.filter(a => a.pipelineStatus === 'In Progress');
  const offersCount = applications.filter(a => a.pipelineStatus === 'Selected').length;

  // Profile completion scoring
  const getProfileCompletion = (p) => {
    if (!p) {
      return {
        percentage: 0,
        missing: ['Personal Details', 'Resume', 'Skills', 'Projects', 'LinkedIn Profile', 'GitHub Profile']
      };
    }

    const missingFields = [];
    let completed = 0;

    const hasPersonalDetails = p.phone && p.branch && p.semester && p.section && p.cgpa && p.campus;
    if (hasPersonalDetails) completed++;
    else missingFields.push('Personal Details');

    if (p.resumeUrl) completed++;
    else missingFields.push('Resume');

    if (p.skills && p.skills.length > 0) completed++;
    else missingFields.push('Skills');

    if (p.projects && p.projects.length > 0) completed++;
    else missingFields.push('Projects');

    if (p.linkedinUrl) completed++;
    else missingFields.push('LinkedIn Profile');

    if (p.githubUrl) completed++;
    else missingFields.push('GitHub Profile');

    return {
      percentage: Math.round((completed / 6) * 100),
      missing: missingFields
    };
  };

  const { percentage: completionPercentage, missing: missingProfileFields } = getProfileCompletion(profile);

  // Filter latest 5 notifications matching student role
  const recentNotifs = notifications
    .filter(n => n.forRole === 'student')
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Here's what's happening with your placement journey
        </p>
      </div>

      {/* SECTION 1 — Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Available Drives"
          value={eligibleCount}
          icon={Briefcase}
          color="accent"
        />
        <DashboardCard
          title="Applications Submitted"
          value={totalApps}
          icon={FileText}
          color="primary"
        />
        <DashboardCard
          title="Active Processes"
          value={activeApps.length}
          icon={TrendingUp}
          color="warning"
        />
        <DashboardCard
          title="Offers Received"
          value={offersCount}
          icon={Award}
          color="success"
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left Side Columns */}
        <div className="lg:col-span-2 flex flex-col">

          {/* SECTION 2 — My Active Applications */}
          <div className="glass-card p-5 space-y-4 flex-1 flex flex-col">
            <h3 className="font-bold text-surface-900 dark:text-white">My Active Applications</h3>
            {activeApps.length === 0 ? (
              <div className="text-center py-12 text-surface-400 flex-1 flex flex-col justify-center">
                <Briefcase size={36} className="mx-auto mb-2.5 opacity-30" />
                <p className="text-sm font-medium">No active recruitment processes.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {activeApps.map(app => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-surface-100 dark:border-surface-700/60 bg-surface-50 dark:bg-surface-800/30 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-bold text-surface-900 dark:text-white text-sm">
                        {app.driveId?.companyName || 'Unknown Company'}
                      </h4>
                      <p className="text-xs text-primary-500 font-semibold mt-0.5">
                        {app.driveId?.role || 'Unknown Role'}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-surface-100 dark:border-surface-800/50 flex flex-col gap-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-surface-400">Current Stage:</span>
                        <span className="font-semibold text-surface-700 dark:text-surface-300">
                          {app.currentStageId?.stageName || 'Screening'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-surface-400">Status:</span>
                        <StatusBadge status="In Progress" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side Column */}
        <div className="flex flex-col">

          {/* SECTION 4 — Profile Completion */}
          <div className="glass-card p-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-surface-900 dark:text-white">Profile Completion</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-surface-600 dark:text-surface-300">Completion Score</span>
                  <span className="text-primary-500">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-surface-100 dark:bg-surface-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {completionPercentage === 100 ? (
              <div className="p-3 bg-success-50 dark:bg-success-950/20 text-success-600 dark:text-success-400 text-xs rounded-xl border border-success-100 dark:border-success-900/30 flex items-center gap-2 mt-4">
                <CheckCircle size={16} className="text-success-500 shrink-0" />
                <span>100% Complete. Profile looks great.</span>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
                  Missing Fields:
                </p>
                <ul className="space-y-1">
                  {missingProfileFields.map(field => (
                    <li
                      key={field}
                      className="text-xs text-danger-500 dark:text-danger-400 flex items-center gap-1.5 font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-danger-500" />
                      {field}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/student/profile"
                  className="text-xs font-bold text-primary-500 hover:text-primary-600 mt-2 block w-fit hover:underline"
                >
                  Complete Profile &rarr;
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* SECTION 3 — Recent Notifications */}
        <div className="lg:col-span-3 glass-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-surface-900 dark:text-white">Recent Notifications</h3>
            <Link
              to="/student/notifications"
              className="text-xs font-bold text-primary-500 hover:text-primary-600 hover:underline"
            >
              View All Notifications
            </Link>
          </div>
          {recentNotifs.length === 0 ? (
            <div className="text-center py-10 text-surface-400">
              <Bell size={36} className="mx-auto mb-2.5 opacity-30" />
              <p className="text-sm font-medium">No recent notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotifs.map(notif => (
                <div
                  key={notif._id}
                  className="p-3.5 rounded-xl border border-surface-100 dark:border-surface-800/60 bg-surface-50/50 dark:bg-surface-800/20 flex gap-3"
                >
                  <div className="mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 block shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-surface-800 dark:text-surface-200">
                      {notif.title}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-surface-400 mt-1">
                      {new Date(notif.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
