'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '@/hooks/useApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuestionComposition {
  MULTIPLE_CHOICE: number;
  TRUE_FALSE: number;
  SHORT_ANSWER: number;
  LONG_ANSWER: number;
  total: number;
}

interface PoolTypeBreakdown {
  type: string;
  count: number;
  totalMarks: number;
  avgMarks: number;
  selectionCount: number;
  expectedMarks: number;
}

interface PoolCompositionItem {
  poolId: number | null;
  poolTitle: string;
  active?: boolean;
  totalQuestions: number;
  selectedQuestions: number;
  totalMarks: number;
  expectedMarks: number;
  types: PoolTypeBreakdown[];
}

interface PerformanceMetrics {
  averageMarks: number;
  averagePercentage: number;
  averageGrade: string;
  averageDurationMinutes: number;
  totalSubmissions: number;
  totalMarksPerTest: number;
}

interface ScoreBucket {
  label: string;
  count: number;
}

interface QuestionDifficulty {
  questionId: number;
  text: string;
  type: string;
  maxMarks: number;
  attempts: number;
  avgObtained: number;
  failureRate: number;
  poolId: number | null;
  poolTitle: string | null;
}

interface AnalyticsData {
  questionComposition: QuestionComposition;
  poolComposition: PoolCompositionItem[];
  activeOverall: ActivePoolOverall;
  performanceMetrics: PerformanceMetrics;
  scoreDistribution: ScoreBucket[];
  questionDifficulty: QuestionDifficulty[];
}

interface ActivePoolOverallType {
  type: string;
  count: number;
  totalMarks: number;
  selectionCount: number;
  avgMarks: number;
  expectedMarks: number;
}

interface ActivePoolOverall {
  totalQuestions: number;
  totalSelectedQuestions: number;
  totalExpectedMarks: number;
  types: ActivePoolOverallType[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Multiple Choice',
  TRUE_FALSE: 'True / False',
  SHORT_ANSWER: 'Short Answer',
  LONG_ANSWER: 'Long Answer',
};

const TYPE_COLORS: Record<string, string> = {
  MULTIPLE_CHOICE: '#6366f1',
  TRUE_FALSE: '#f59e0b',
  SHORT_ANSWER: '#10b981',
  LONG_ANSWER: '#f43f5e',
};

const GRADE_COLOR: Record<string, string> = {
  'A+': '#059669',
  A: '#10b981',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#f97316',
  F: '#ef4444',
  'N/A': '#9ca3af',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: string;
  gradient: string;
  valueColor?: string;
}

function KpiCard({ title, value, sub, icon, gradient, valueColor }: KpiCardProps) {
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${gradient} ring-1 ring-black/5`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p
        className="text-2xl font-black text-gray-900 truncate"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function DifficultyRow({ q }: { q: QuestionDifficulty }) {
  const scorePct = q.maxMarks > 0 ? Math.round((q.avgObtained / q.maxMarks) * 100) : 0;
  const rateColor =
    q.failureRate >= 70 ? 'bg-red-500' : q.failureRate >= 40 ? 'bg-orange-400' : 'bg-emerald-400';
  const badgeColor =
    q.failureRate >= 70
      ? 'bg-red-500 text-white'
      : q.failureRate >= 40
        ? 'bg-orange-400 text-white'
        : 'bg-emerald-400 text-white';

  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      <div
        className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold ${badgeColor}`}
      >
        {q.failureRate}%
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2">
          {q.text}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
          <span className="px-2 py-0.5 bg-gray-100 rounded-full font-medium">
            {TYPE_LABELS[q.type] ?? q.type}
          </span>
          <span>
            {q.attempts} attempt{q.attempts !== 1 ? 's' : ''}
          </span>
          <span>
            Avg score: {q.avgObtained}/{q.maxMarks} ({scorePct}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${rateColor} transition-all duration-500`}
              style={{ width: `${q.failureRate}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500 shrink-0">
            {q.failureRate}% failed
          </span>
        </div>
      </div>
    </div>
  );
}

interface DonutChartProps {
  title: string;
  centerValue: string | number;
  centerLabel: string;
  data: { type: string; name: string; value: number; color: string }[];
  tooltipSuffix: string;
}

function DonutChartWithLegend({
  title,
  centerValue,
  centerLabel,
  data,
  tooltipSuffix,
}: DonutChartProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col items-center">
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 text-center">
        {title}
      </p>
      <div className="relative mb-4">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={72}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive
            >
              {data.map((entry) => (
                <Cell key={entry.type} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} ${tooltipSuffix}`, name]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-black text-gray-900 leading-none">{centerValue}</span>
          <span className="text-[10px] text-gray-400 mt-0.5">{centerLabel}</span>
        </div>
      </div>
      {/* Legend */}
      <div className="w-full space-y-1.5">
        {data.map((entry) => (
          <div key={entry.type} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-gray-600 truncate">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold text-gray-800 shrink-0">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PoolCompositionCard({ pool }: { pool: PoolCompositionItem }) {
  const isGeneral = pool.poolId === null;
  const isInactive = pool.active === false;

  const pieDataTotal = pool.types
    .filter((t) => t.count > 0)
    .map((t) => ({
      type: t.type,
      name: TYPE_LABELS[t.type] ?? t.type,
      value: t.count,
      color: TYPE_COLORS[t.type] ?? '#6b7280',
    }));

  const pieDataSelected = pool.types
    .filter((t) => t.selectionCount > 0)
    .map((t) => ({
      type: t.type,
      name: TYPE_LABELS[t.type] ?? t.type,
      value: t.selectionCount,
      color: TYPE_COLORS[t.type] ?? '#6b7280',
    }));

  const pieDataMarks = pool.types
    .filter((t) => t.expectedMarks > 0)
    .map((t) => ({
      type: t.type,
      name: TYPE_LABELS[t.type] ?? t.type,
      value: t.expectedMarks,
      color: TYPE_COLORS[t.type] ?? '#6b7280',
    }));

  return (
    <div
      className={`bg-gray-50 rounded-2xl border border-gray-100 p-6 transition-colors ${isInactive ? 'opacity-50 grayscale' : 'hover:border-gray-200'}`}
    >
      {/* Pool header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${isGeneral ? 'bg-gray-200 text-gray-600' : isInactive ? 'bg-gray-300 text-gray-500' : 'bg-indigo-100 text-indigo-700'}`}
          >
            {isGeneral ? 'General' : 'Pool'}
          </span>
          <h4 className="text-sm font-bold text-gray-900">{pool.poolTitle}</h4>
          {isInactive && (
            <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs font-bold rounded-full">
              Inactive
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-gray-900">{pool.expectedMarks}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Expected marks</p>
        </div>
      </div>

      {/* Three pie charts row */}
      <div className="grid grid-cols-3 gap-4 mb-6 bg-white rounded-xl p-5 border border-gray-100">
        <DonutChartWithLegend
          title="Total Questions"
          centerValue={pool.totalQuestions}
          centerLabel="total"
          data={pieDataTotal}
          tooltipSuffix="questions"
        />
        <div className="border-l border-r border-gray-100 px-4">
          <DonutChartWithLegend
            title="Selected Questions"
            centerValue={pool.selectedQuestions}
            centerLabel="selected"
            data={pieDataSelected}
            tooltipSuffix="questions"
          />
        </div>
        <DonutChartWithLegend
          title="Expected Marks"
          centerValue={pool.expectedMarks}
          centerLabel="marks"
          data={pieDataMarks}
          tooltipSuffix="marks"
        />
      </div>

      {/* Type breakdown table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-400 uppercase tracking-wide border-b border-gray-100">
              <th className="text-left px-4 py-2.5 font-semibold">Type</th>
              <th className="text-center px-3 py-2.5 font-semibold">Available</th>
              <th className="text-center px-3 py-2.5 font-semibold">Selected</th>
              <th className="text-center px-3 py-2.5 font-semibold">Avg Marks</th>
              <th className="text-center px-3 py-2.5 font-semibold">Exp. Marks</th>
              <th className="text-center px-3 py-2.5 font-semibold">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {pool.types.map((t) => {
              const marksPct =
                pool.expectedMarks > 0
                  ? Math.round((t.expectedMarks / pool.expectedMarks) * 100)
                  : 0;
              return (
                <tr
                  key={t.type}
                  className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: TYPE_COLORS[t.type] ?? '#6b7280' }}
                      />
                      <span className="font-medium text-gray-700">
                        {TYPE_LABELS[t.type] ?? t.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{t.count}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{t.selectionCount}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{t.avgMarks}</td>
                  <td className="px-3 py-2.5 text-center font-semibold text-gray-900">
                    {t.expectedMarks}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold">
                      {marksPct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-4 py-2.5 font-bold text-gray-800">Total</td>
              <td className="px-3 py-2.5 text-center font-bold text-gray-800">
                {pool.totalQuestions}
              </td>
              <td className="px-3 py-2.5 text-center font-bold text-gray-800">
                {pool.selectedQuestions}
              </td>
              <td className="px-3 py-2.5 text-center text-gray-400">—</td>
              <td className="px-3 py-2.5 text-center font-bold text-gray-900">
                {pool.expectedMarks}
              </td>
              <td className="px-3 py-2.5 text-center font-bold text-gray-900">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

interface ActivePoolRowProps {
  title: string;
  centerValue: number;
  centerLabel: string;
  total: number;
  tooltipSuffix: string;
  donutSide: 'left' | 'right';
  data: { type: string; name: string; value: number; color: string }[];
}

function ActivePoolRow({
  title,
  centerValue,
  centerLabel,
  total,
  tooltipSuffix,
  donutSide,
  data,
}: ActivePoolRowProps) {
  const pieDataWithPct = data.map((entry) => ({
    ...entry,
    pct: total > 0 ? Math.round((entry.value / total) * 100) : 0,
  }));

  const donut = (
    <div className="relative shrink-0">
      <ResponsiveContainer width={220} height={220}>
        <PieChart>
          <Pie
            data={pieDataWithPct}
            cx="50%"
            cy="50%"
            innerRadius={68}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            isAnimationActive
          >
            {pieDataWithPct.map((entry) => (
              <Cell key={entry.type} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} ${tooltipSuffix}`, String(name)]}
            contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 13 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-black text-gray-900 leading-none">{centerValue}</span>
        <span className="text-xs text-gray-400 mt-0.5">{centerLabel}</span>
      </div>
    </div>
  );

  const legend = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
      {pieDataWithPct.map((entry) => (
        <div
          key={entry.type}
          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
        >
          <div
            className="w-3 h-10 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <div>
            <p className="text-sm font-semibold text-gray-800">{entry.name}</p>
            <p className="text-xs text-gray-500">
              {entry.value} {tooltipSuffix} · {entry.pct}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">{title}</p>
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {donutSide === 'left' ? (
          <>
            {donut}
            {legend}
          </>
        ) : (
          <>
            {legend}
            {donut}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type AnalyticsSubtab = 'composition' | 'students';

interface AnalyticsSectionProps {
  testId?: string;
}

export default function AnalyticsSection({ testId }: AnalyticsSectionProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtab, setSubtab] = useState<AnalyticsSubtab>('composition');

  const load = useCallback(async () => {
    if (!testId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api(`/tests/${testId}/analytics`, { auth: true });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'Failed to load analytics');
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 flex items-center justify-center min-h-[320px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading analytics…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
          <span className="text-2xl shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-red-800">Failed to load analytics</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={load}
            className="shrink-0 px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    poolComposition,
    activeOverall,
    performanceMetrics: pm,
    scoreDistribution,
    questionDifficulty,
  } = data;

  const gradeColor = GRADE_COLOR[pm.averageGrade] ?? '#6b7280';
  const hasSubmissions = pm.totalSubmissions > 0;

  // Group difficulty rows by pool for display
  type DiffGroup = { key: string; label: string; isPool: boolean; rows: QuestionDifficulty[] };
  const diffGroups: DiffGroup[] = [];
  const seen = new Map<string, DiffGroup>();
  for (const q of questionDifficulty) {
    const key = q.poolId !== null ? `pool-${q.poolId}` : 'ungrouped';
    if (!seen.has(key)) {
      const g: DiffGroup = {
        key,
        label: q.poolTitle ?? 'General Questions',
        isPool: q.poolId !== null,
        rows: [],
      };
      seen.set(key, g);
      diffGroups.push(g);
    }
    seen.get(key)!.rows.push(q);
  }

  const totalExpectedMarks = poolComposition.reduce((a, p) => a + p.expectedMarks, 0);

  return (
    <div className="space-y-6 mb-8">
      {/* ── Section header with subtab nav ── */}
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-2xl font-bold text-gray-900">Test Analytics</h2>
          {hasSubmissions && (
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
              {pm.totalSubmissions} submission{pm.totalSubmissions !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm mb-5">
          Detailed breakdown of test structure and student performance
        </p>

        {/* Subtab pills */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {(
            [
              { key: 'composition', label: 'Test Composition', icon: '🧩' },
              { key: 'students', label: 'Student Analytics', icon: '📊' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSubtab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                subtab === tab.key
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TEST COMPOSITION SUBTAB
          ════════════════════════════════════════════════════════════════════════ */}
      {subtab === 'composition' && (
        <>
          {/* Active Pool Overall — Composition Charts */}
          {activeOverall && activeOverall.types.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-lg font-bold text-gray-900">Overall Active Pool Composition</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-indigo-600">
                      {activeOverall.totalQuestions}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">
                      Total Questions
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-indigo-600">
                      {activeOverall.totalSelectedQuestions}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">
                      Selected
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-indigo-600">
                      {activeOverall.totalExpectedMarks}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">
                      Exp. Marks
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-8">
                Aggregated composition across all active question pools
              </p>

              <div className="space-y-10">
                <ActivePoolRow
                  title="Total Questions by Type"
                  centerValue={activeOverall.totalQuestions}
                  centerLabel="questions"
                  total={activeOverall.totalQuestions}
                  tooltipSuffix="questions"
                  donutSide="left"
                  data={activeOverall.types
                    .filter((t) => t.count > 0)
                    .map((t) => ({
                      type: t.type,
                      name: TYPE_LABELS[t.type] ?? t.type,
                      value: t.count,
                      color: TYPE_COLORS[t.type] ?? '#6b7280',
                    }))}
                />

                <ActivePoolRow
                  title="Selected Questions by Type"
                  centerValue={activeOverall.totalSelectedQuestions}
                  centerLabel="selected"
                  total={activeOverall.totalSelectedQuestions}
                  tooltipSuffix="questions"
                  donutSide="right"
                  data={activeOverall.types
                    .filter((t) => t.selectionCount > 0)
                    .map((t) => ({
                      type: t.type,
                      name: TYPE_LABELS[t.type] ?? t.type,
                      value: t.selectionCount,
                      color: TYPE_COLORS[t.type] ?? '#6b7280',
                    }))}
                />

                <ActivePoolRow
                  title="Expected Marks by Type"
                  centerValue={activeOverall.totalExpectedMarks}
                  centerLabel="marks"
                  total={activeOverall.totalExpectedMarks}
                  tooltipSuffix="marks"
                  donutSide="left"
                  data={activeOverall.types
                    .filter((t) => t.expectedMarks > 0)
                    .map((t) => ({
                      type: t.type,
                      name: TYPE_LABELS[t.type] ?? t.type,
                      value: t.expectedMarks,
                      color: TYPE_COLORS[t.type] ?? '#6b7280',
                    }))}
                />
              </div>
            </div>
          )}

          {/* Pool-wise composition */}
          {poolComposition.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-gray-900">Pool-wise Breakdown</h3>
                <div className="text-right">
                  <p className="text-lg font-black text-indigo-600">{totalExpectedMarks}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    Total expected marks
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Per-pool question types, selection counts, and expected marks based on average marks
                per type
              </p>

              <div className="space-y-4">
                {poolComposition.map((pool) => (
                  <PoolCompositionCard key={pool.poolId ?? 'general'} pool={pool} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STUDENT ANALYTICS SUBTAB
          ════════════════════════════════════════════════════════════════════════ */}
      {subtab === 'students' && (
        <>
          {/* No submissions empty state */}
          {!hasSubmissions && (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="text-center py-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
                <span className="text-6xl mb-4 block">📊</span>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Submissions Yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto text-sm">
                  Performance analytics will appear once students start submitting the test.
                </p>
              </div>
            </div>
          )}

          {hasSubmissions && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title="Avg Marks"
                  value={`${pm.averageMarks} / ${pm.totalMarksPerTest}`}
                  sub={`across ${pm.totalSubmissions} submissions`}
                  icon="🎯"
                  gradient="from-indigo-50 to-indigo-100"
                />
                <KpiCard
                  title="Avg Score"
                  value={`${pm.averagePercentage}%`}
                  sub="mean percentage"
                  icon="📈"
                  gradient="from-blue-50 to-blue-100"
                />
                <KpiCard
                  title="Avg Grade"
                  value={pm.averageGrade}
                  sub={`class average`}
                  icon="🏆"
                  gradient="from-emerald-50 to-emerald-100"
                  valueColor={gradeColor}
                />
                <KpiCard
                  title="Avg Duration"
                  value={pm.averageDurationMinutes > 0 ? `${pm.averageDurationMinutes} min` : '—'}
                  sub="time to complete"
                  icon="⏱️"
                  gradient="from-orange-50 to-orange-100"
                />
              </div>

              {/* Score Distribution */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Score Distribution</h3>
                <p className="text-sm text-gray-500 mb-6">
                  How scores are spread across all {pm.totalSubmissions} submission
                  {pm.totalSubmissions !== 1 ? 's' : ''}
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={scoreDistribution}
                    margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#f3f4f6' }}
                      formatter={(value) => [value ?? 0, 'Students']}
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                        fontSize: 13,
                      }}
                    />
                    <Bar dataKey="count" name="Students" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Difficulty Analysis */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Difficulty Analysis</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Questions ranked by failure rate — students who scored 0
                </p>

                {questionDifficulty.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <span className="text-4xl block mb-2">🎉</span>
                    No difficulty data available yet
                  </div>
                ) : (
                  <div className="space-y-6">
                    {diffGroups.map((group) => (
                      <div key={group.key}>
                        {diffGroups.length > 1 && (
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                group.isPool
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {group.isPool ? 'Pool: ' : ''}
                              {group.label}
                            </span>
                            <span className="text-xs text-gray-400">
                              {group.rows.length} question{group.rows.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        <div className="space-y-2">
                          {group.rows.map((q) => (
                            <DifficultyRow key={q.questionId} q={q} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
