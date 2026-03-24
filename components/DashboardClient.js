'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/Toast';

export default function DashboardClient() {
  const [students, setStudents] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function fetchAll() {
      const [studentsRes, slotsRes] = await Promise.all([
        supabase.from('students').select('*').order('grade').order('name'),
        supabase.from('slots').select('*, files(id)'),
      ]);
      setStudents(studentsRes.data || []);
      setSlots(slotsRes.data || []);
      setLoading(false);
    }
    fetchAll();
  }, []);

  // Aggregate stats
  const totalStudents = students.length;
  const totalSlots = slots.length;
  const uploadedSlots = slots.filter(s => s.status === 'uploaded' || s.status === 'evaluated').length;
  const evaluatedSlots = slots.filter(s => s.status === 'evaluated').length;
  const avgEval = evaluatedSlots > 0
    ? (slots.filter(s => s.evaluation).reduce((sum, s) => sum + s.evaluation, 0) / evaluatedSlots).toFixed(1)
    : '—';
  const totalFiles = slots.reduce((sum, s) => sum + (s.files?.length || 0), 0);

  // Per-student stats
  function studentStats(studentId) {
    const sList = slots.filter(s => s.student_id === studentId);
    const uploaded = sList.filter(s => s.status !== 'empty').length;
    const evaluated = sList.filter(s => s.status === 'evaluated').length;
    const avg = evaluated > 0
      ? (sList.filter(s => s.evaluation).reduce((sum, s) => sum + s.evaluation, 0) / evaluated).toFixed(1)
      : '—';
    return { uploaded, evaluated, avg };
  }

  // ③ CSVエクスポート
  function exportCSV() {
    const rows = [['生徒名', '学年', '教科', '教科数', 'アップロード済スロット', '評価済スロット', '平均評価']];

    for (const student of students) {
      const stats = studentStats(student.id);
      rows.push([
        student.name,
        student.grade,
        (student.subjects || []).join('・'),
        String(student.subjects?.length || 0),
        String(stats.uploaded),
        String(stats.evaluated),
        stats.avg,
      ]);
    }

    const bom = '\uFEFF';
    const csv = bom + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `printbase_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('CSVをエクスポートしました');
  }

  if (loading) return <div className="main-content"><div className="loading"><div className="spinner"></div></div></div>;

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/">生徒一覧</Link>
        <span className="sep">›</span>
        <span>ダッシュボード</span>
      </nav>

      <div className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 className="page-title">📊 進捗ダッシュボード</h1>
            <p className="page-subtitle">全生徒の進捗状況と評価サマリー</p>
          </div>
          <button className="btn btn-primary" onClick={exportCSV}>📥 CSVエクスポート</button>
        </div>

        {/* Summary Cards */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">{totalStudents}</div>
            <div className="stat-label">生徒数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{uploadedSlots}</div>
            <div className="stat-label">アップロード済</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{evaluatedSlots}</div>
            <div className="stat-label">評価済</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{avgEval}</div>
            <div className="stat-label">平均評価</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalFiles}</div>
            <div className="stat-label">総ファイル数</div>
          </div>
        </div>

        {/* Per-student table */}
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>生徒別進捗</h2>
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>生徒名</th>
                  <th>学年</th>
                  <th>教科</th>
                  <th>UP済</th>
                  <th>評価済</th>
                  <th>平均評価</th>
                  <th>進捗</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const stats = studentStats(student.id);
                  const totalPossible = (student.subjects?.length || 1) * 24;
                  const progressPct = totalPossible > 0 ? Math.round((stats.uploaded / totalPossible) * 100) : 0;

                  return (
                    <tr key={student.id}>
                      <td>
                        <Link href={`/student/${student.id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                          {student.name}
                        </Link>
                      </td>
                      <td>{student.grade}</td>
                      <td>{(student.subjects || []).join('・')}</td>
                      <td>{stats.uploaded}</td>
                      <td>{stats.evaluated}</td>
                      <td>
                        {stats.avg !== '—' && (
                          <span style={{ color: `var(--eval-${Math.round(parseFloat(stats.avg))})`, fontWeight: 600 }}>
                            {stats.avg}
                          </span>
                        )}
                        {stats.avg === '—' && <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                      </td>
                      <td>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${progressPct}%` }}></div>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{progressPct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Toast message={toast} onClear={() => setToast('')} />
    </>
  );
}
