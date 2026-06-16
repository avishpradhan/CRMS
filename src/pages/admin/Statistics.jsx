import { placementStats } from '../../data/mockData';
import DashboardCard from '../../components/shared/DashboardCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Target, TrendingUp, Award, Users } from 'lucide-react';

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function AdminStatistics() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Placement Statistics</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Comprehensive placement analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Placement Rate" value={placementStats.overallStats.placementRate} icon={Target} color="primary" trend="up" trendValue="+5.2%" />
        <DashboardCard title="Total Placed" value={placementStats.overallStats.totalPlaced} icon={Users} color="success" trend="up" trendValue="+42 this month" />
        <DashboardCard title="Avg Package" value={placementStats.overallStats.averagePackage} icon={TrendingUp} color="accent" />
        <DashboardCard title="Highest Package" value={placementStats.overallStats.highestPackage} icon={Award} color="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Placement Percentage */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-surface-900 dark:text-white mb-4">Branch-wise Placement Percentage</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={placementStats.branchWise}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="branch" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '0.75rem', color: '#fff', fontSize: '0.8125rem' }} />
              <Bar dataKey="percentage" radius={[6, 6, 0, 0]} barSize={32}>
                {placementStats.branchWise.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Company-wise */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-surface-900 dark:text-white mb-4">Company-wise Hiring Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={placementStats.companyWise} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="hires" nameKey="company">
                {placementStats.companyWise.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '0.75rem', color: '#fff', fontSize: '0.8125rem' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {placementStats.companyWise.map((c, i) => (
              <div key={c.company} className="flex items-center gap-1.5 text-xs text-surface-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /> {c.company} ({c.hires})
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-surface-900 dark:text-white mb-4">Monthly Placement Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={placementStats.monthlyTrend}>
              <defs>
                <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '0.75rem', color: '#fff', fontSize: '0.8125rem' }} />
              <Area type="monotone" dataKey="placements" stroke="#14b8a6" strokeWidth={2.5} fill="url(#adminGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Applications Trend */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-surface-900 dark:text-white mb-4">Application Volume Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={placementStats.applicationsPerMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '0.75rem', color: '#fff', fontSize: '0.8125rem' }} />
              <Line type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
