import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  TrendingUp,
  Link2,
  Brain,
  Target,
  Activity,
} from 'lucide-react';
import { GlassCard } from '../ui/glass-card';
import { ds } from '../../lib/design-tokens';
import { CLAIM_TYPE_LABELS, CLAIM_TYPE_ICONS } from '../../types';
import type { HistoryRecord } from '../../types';

interface VerificationDashboardProps {
  records: HistoryRecord[];
}

// Status color mapping
const STATUS_COLORS = {
  verified: '#10b981',
  partially_verified: '#3b82f6',
  inconclusive: '#f59e0b',
  failed: '#ef4444',
};

const STATUS_LABELS = {
  verified: 'Verified',
  partially_verified: 'Likely Verified',
  inconclusive: 'Needs Review',
  failed: 'Rejected',
};

export default function VerificationDashboard({ records }: VerificationDashboardProps) {
  // Calculate metrics
  const metrics = useMemo(() => {
    const total = records.length;
    const verified = records.filter((r) => r.status === 'verified').length;
    const likelyVerified = records.filter((r) => r.status === 'partially_verified').length;
    const needsReview = records.filter((r) => r.status === 'inconclusive').length;
    const rejected = records.filter((r) => r.status === 'failed').length;
    const avgConfidence =
      total > 0 ? records.reduce((sum, r) => sum + r.confidence, 0) / total : 0;
    const blockchainAnchored = records.filter((r) => r.blockchainStatus).length;
    const successRate = total > 0 ? ((verified + likelyVerified) / total) * 100 : 0;

    // Most common claim type
    const claimTypeCounts: Record<string, number> = {};
    records.forEach((r) => {
      claimTypeCounts[r.claimType] = (claimTypeCounts[r.claimType] || 0) + 1;
    });
    const mostCommonType =
      Object.entries(claimTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Verifications over time (by date)
    const dateCounts: Record<string, number> = {};
    records.forEach((r) => {
      const date = new Date(r.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    const timelineData = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

    // Claim type distribution
    const claimTypeData = Object.entries(claimTypeCounts)
      .map(([type, count]) => ({
        type: CLAIM_TYPE_LABELS[type as keyof typeof CLAIM_TYPE_LABELS] || type,
        count,
        icon: CLAIM_TYPE_ICONS[type as keyof typeof CLAIM_TYPE_ICONS] || '📄',
      }))
      .sort((a, b) => b.count - a.count);

    // Status distribution for doughnut
    const statusData = [
      { name: 'Verified', value: verified, color: STATUS_COLORS.verified },
      { name: 'Likely Verified', value: likelyVerified, color: STATUS_COLORS.partially_verified },
      { name: 'Needs Review', value: needsReview, color: STATUS_COLORS.inconclusive },
      { name: 'Rejected', value: rejected, color: STATUS_COLORS.failed },
    ].filter((s) => s.value > 0);

    return {
      total,
      verified,
      likelyVerified,
      needsReview,
      rejected,
      avgConfidence,
      blockchainAnchored,
      successRate,
      mostCommonType,
      timelineData,
      claimTypeData,
      statusData,
    };
  }, [records]);

  if (records.length === 0) return null;

  return (
    <div className="space-y-6 mb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
        <KpiCard
          icon={ShieldCheck}
          label="Total Verifications"
          value={metrics.total.toString()}
          color="text-blue-400"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Verified"
          value={metrics.verified.toString()}
          color="text-emerald-400"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Likely Verified"
          value={metrics.likelyVerified.toString()}
          color="text-blue-400"
        />
        <KpiCard
          icon={AlertCircle}
          label="Needs Review"
          value={metrics.needsReview.toString()}
          color="text-amber-400"
        />
        <KpiCard
          icon={XCircle}
          label="Rejected"
          value={metrics.rejected.toString()}
          color="text-red-400"
        />
        <KpiCard
          icon={TrendingUp}
          label="Avg Confidence"
          value={`${(metrics.avgConfidence * 100).toFixed(1)}%`}
          color="text-purple-400"
        />
        <KpiCard
          icon={Link2}
          label="Blockchain Anchored"
          value={metrics.blockchainAnchored.toString()}
          color="text-cyan-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Doughnut Chart - Status Distribution */}
        <GlassCard padding="md" animate>
          <h3 className={`${ds.label} mb-4`}>Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {metrics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111113',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {metrics.statusData.map((status) => (
              <div key={status.name} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <span className="text-white/70">{status.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Bar Chart - Claim Categories */}
        <GlassCard padding="md" animate>
          <h3 className={`${ds.label} mb-4`}>Claim Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.claimTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="type"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111113',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Line Chart - Verifications Over Time */}
        <GlassCard padding="md" animate>
          <h3 className={`${ds.label} mb-4`}>Verifications Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111113',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* AI Insights Card */}
      <GlassCard padding="md" animate>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-purple-400" />
          <h3 className={ds.label}>AI Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InsightCard
            icon={Target}
            label="Most Common Category"
            value={
              metrics.mostCommonType
                ? `${CLAIM_TYPE_ICONS[metrics.mostCommonType as keyof typeof CLAIM_TYPE_ICONS] || '📄'} ${
                    CLAIM_TYPE_LABELS[metrics.mostCommonType as keyof typeof CLAIM_TYPE_LABELS] ||
                    metrics.mostCommonType
                  }`
                : 'N/A'
            }
            color="text-blue-400"
          />
          <InsightCard
            icon={Activity}
            label="Success Rate"
            value={`${metrics.successRate.toFixed(1)}%`}
            subtitle="Verified + Likely Verified"
            color="text-emerald-400"
          />
          <InsightCard
            icon={TrendingUp}
            label="Average Confidence"
            value={`${(metrics.avgConfidence * 100).toFixed(1)}%`}
            subtitle="Across all verifications"
            color="text-purple-400"
          />
          <InsightCard
            icon={ShieldCheck}
            label="Blockchain Anchored"
            value={`${metrics.blockchainAnchored} of ${metrics.total}`}
            subtitle={`${((metrics.blockchainAnchored / metrics.total) * 100).toFixed(0)}% anchored`}
            color="text-cyan-400"
          />
        </div>
      </GlassCard>
    </div>
  );
}

// KPI Card Component
function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <GlassCard padding="sm" animate>
      <div className="flex items-start justify-between mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className={ds.metricValue}>{value}</div>
      <div className={`${ds.metricLabel} text-white/50 mt-1`}>{label}</div>
    </GlassCard>
  );
}

// Insight Card Component
function InsightCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-white/60">{label}</span>
      </div>
      <div className="text-lg font-bold text-white mb-1">{value}</div>
      {subtitle && <div className="text-xs text-white/40">{subtitle}</div>}
    </div>
  );
}
