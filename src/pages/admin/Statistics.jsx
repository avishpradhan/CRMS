import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { RefreshCw, TrendingUp, Info } from 'lucide-react';

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];
const CAMPUSES = ['GEU Dehradun', 'GEHU Dehradun', 'GEHU Bhimtal', 'GEHU Haldwani'];

function ChartPlaceholder({ message = 'No placement data available yet.' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[280px] bg-surface-50/50 dark:bg-surface-800/10 border border-dashed border-surface-200 dark:border-surface-700/50 rounded-xl p-5">
      <TrendingUp size={36} className="text-surface-400 mb-2 opacity-30" />
      <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{message}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Determine the type of chart based on available properties
    const title = data.branch || data.campus || data.batch || data.companyName;
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 text-xs shadow-xl space-y-1">
        <p className="font-bold text-sm text-indigo-400">{title}</p>
        {data.percentage !== undefined && (
          <p className="font-semibold">Placement Rate: <span className="text-emerald-400">{data.percentage}%</span></p>
        )}
        {data.placedCount !== undefined && (
          <p className="text-slate-300">Placed: {data.placedCount} / {data.totalCount} students</p>
        )}
        {data.placements !== undefined && (
          <p className="font-semibold text-emerald-400">Placements: {data.placements} students</p>
        )}
        {data.drivesCount !== undefined && (
          <p className="font-semibold text-indigo-300">Drives Posted: {data.drivesCount}</p>
        )}
      </div>
    );
  }
  return null;
};

export default function AdminStatistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('');

  const token = localStorage.getItem('crms_token');

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/admin/batches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBatches(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch batches for filtering:', err);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string
      const params = new URLSearchParams();
      if (selectedBatch) params.append('batch', selectedBatch);
      if (selectedCampus) params.append('campus', selectedCampus);
      if (selectedTimeframe) params.append('timeframe', selectedTimeframe);

      const res = await fetch(`/api/admin/stats?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load statistics');
      }

      setStats(data.data || null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [selectedBatch, selectedCampus, selectedTimeframe]);

  const isEmpty = 
    !stats || (
      (!stats.branchWisePercent || stats.branchWisePercent.length === 0) &&
      (!stats.campusWisePercent || stats.campusWisePercent.length === 0) &&
      (!stats.batchWisePercent || stats.batchWisePercent.length === 0) &&
      (!stats.branchPlacements || stats.branchPlacements.length === 0) &&
      (!stats.recruiterEngagement || stats.recruiterEngagement.length === 0)
    );

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw size={24} className="text-primary-500 animate-spin" />
        <p className="text-sm text-surface-400 font-medium">Computing live analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Placement Statistics</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Live computed placement metrics & analytics</p>
        </div>
      </div>

      {/* Top Filter Panel */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-150 dark:border-surface-800">
        <div className="flex flex-wrap items-center gap-6 w-full sm:w-auto">
          {/* Timeframe Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Timeframe:</span>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="input-field !py-1.5 !px-3 !text-xs !w-auto bg-transparent"
            >
              <option value="" className="dark:bg-surface-900">All Time</option>
              <option value="current-year" className="dark:bg-surface-900">Current Academic Year</option>
            </select>
          </div>

          {/* Batch Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Batch:</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="input-field !py-1.5 !px-3 !text-xs !w-auto bg-transparent"
            >
              <option value="" className="dark:bg-surface-900">All Batches</option>
              {batches.map((b) => {
                const canonical = b.canonicalBatch || `${b.startYear}-${b.endYear}`;
                return (
                  <option key={b._id} value={canonical} className="dark:bg-surface-900">
                    {b.batchName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Campus Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Campus:</span>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="input-field !py-1.5 !px-3 !text-xs !w-auto bg-transparent"
            >
              <option value="" className="dark:bg-surface-900">All Campuses</option>
              {CAMPUSES.map((c) => (
                <option key={c} value={c} className="dark:bg-surface-900">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-primary-500 font-semibold self-end">
            <RefreshCw size={14} className="animate-spin" />
            Recalculating...
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <Info size={18} />
          <span>{error}</span>
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center min-h-[360px] bg-white dark:bg-surface-900 border border-surface-150 dark:border-surface-800 rounded-xl p-8 text-center">
          <TrendingUp size={48} className="text-surface-400 mb-3 opacity-30 animate-pulse" />
          <h3 className="text-lg font-bold text-surface-900 dark:text-white">No Placement Data Available</h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mt-1">There is currently no statistical records matching the active filters to render analytics graphs.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 1. Branch-wise Placement Percentage */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-surface-900 dark:text-white mb-4">Branch-wise Placement Percentage</h3>
            {!stats.branchWisePercent || stats.branchWisePercent.length === 0 ? (
              <ChartPlaceholder />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.branchWisePercent}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:stroke-surface-800" />
                  <XAxis dataKey="branch" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]} barSize={28}>
                    {stats.branchWisePercent.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 2. Campus-wise Placement Percentage */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-surface-900 dark:text-white mb-4">Campus-wise Placement Percentage</h3>
            {!stats.campusWisePercent || stats.campusWisePercent.length === 0 ? (
              <ChartPlaceholder />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.campusWisePercent}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:stroke-surface-800" />
                  <XAxis dataKey="campus" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]} barSize={28}>
                    {stats.campusWisePercent.map((_, i) => (
                      <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 3. Batch-wise Placement Percentage */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-surface-900 dark:text-white mb-4">Batch-wise Placement Percentage</h3>
            {!stats.batchWisePercent || stats.batchWisePercent.length === 0 ? (
              <ChartPlaceholder />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.batchWisePercent}>
                  <defs>
                    <linearGradient id="placementGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:stroke-surface-800" />
                  <XAxis dataKey="batch" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2} fill="url(#placementGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 4. Branch-wise Placements Distribution */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-surface-900 dark:text-white mb-4">Branch-wise Placements</h3>
            {!stats.branchPlacements || stats.branchPlacements.length === 0 ? (
              <ChartPlaceholder />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.branchPlacements}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="placements"
                    nameKey="branch"
                  >
                    {stats.branchPlacements.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {(stats.branchPlacements || []).map((c, i) => (
                <div key={c.branch} className="flex items-center gap-1.5 text-xs text-surface-500 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {c.branch} ({c.placements})
                </div>
              ))}
            </div>
          </div>

          {/* 5. Recruiter Engagement Analytics */}
          <div className="glass-card p-5 lg:col-span-2">
            <h3 className="font-bold text-surface-900 dark:text-white mb-4">Recruiter Engagement (Drives Posted)</h3>
            {!stats.recruiterEngagement || stats.recruiterEngagement.length === 0 ? (
              <ChartPlaceholder />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.recruiterEngagement} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} className="dark:stroke-surface-800" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="companyName" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                  <Bar dataKey="drivesCount" radius={[0, 6, 6, 0]} barSize={16}>
                    {stats.recruiterEngagement.map((_, i) => (
                      <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
