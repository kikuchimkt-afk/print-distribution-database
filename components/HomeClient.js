'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AddStudentModal from '@/components/AddStudentModal';
import EditStudentModal from '@/components/EditStudentModal';
import Toast from '@/components/Toast';

const SUBJECT_CLASS = { '数学': 'math', '英語': 'english', '国語': 'japanese', '理科': 'science', '社会': 'social', '英検': 'eiken' };

export default function HomeClient() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => { fetchStudents(); }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('grade')
        .order('name');
      if (!error) setStudents(data || []);
    } catch (e) {
      console.error('Fetch error:', e);
    }
    setLoading(false);
  }

  const grades = ['all', ...new Set(students.map(s => s.grade))];
  const gradeOrder = { '小5': 0, '小6': 1, '中1': 2, '中2': 3, '中3': 4, '高1': 5, '高2': 6, '高3': 7 };
  grades.sort((a, b) => {
    if (a === 'all') return -1;
    if (b === 'all') return 1;
    return (gradeOrder[a] ?? 99) - (gradeOrder[b] ?? 99);
  });

  const filtered = students.filter(s => {
    const matchSearch = !search || s.name.includes(search);
    const matchGrade = gradeFilter === 'all' || s.grade === gradeFilter;
    return matchSearch && matchGrade;
  });

  async function handleStudentAdded() {
    await fetchStudents();
    setShowAdd(false);
    setToast('生徒を追加しました');
  }

  async function handleStudentEdited() {
    await fetchStudents();
    setEditStudent(null);
    setToast('生徒情報を更新しました');
  }

  async function handleStudentDeleted() {
    await fetchStudents();
    setEditStudent(null);
    setToast('生徒を削除しました');
  }

  return (
    <>
      <nav className="breadcrumb">
        <span>生徒一覧</span>
      </nav>

      <div className="main-content">
        <h1 className="page-title">生徒一覧</h1>
        <p className="page-subtitle">{loading ? '読み込み中…' : `${filtered.length}名の生徒`}</p>

        <div className="controls-bar">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="生徒名で検索…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            {grades.map(g => (
              <button
                key={g}
                className={`chip ${g === gradeFilter ? 'active' : ''}`}
                onClick={() => setGradeFilter(g)}
              >
                {g === 'all' ? 'すべて' : g}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <div className="student-grid">
            {filtered.map(s => (
              <div key={s.id} className="student-card" style={{ position: 'relative' }}>
                <Link href={`/student/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="student-name">{s.name}</div>
                  <div className="student-grade">{s.grade}</div>
                  <div className="subject-tags">
                    {(s.subjects || []).map(subj => (
                      <span key={subj} className={`subject-tag ${SUBJECT_CLASS[subj] || ''}`}>{subj}</span>
                    ))}
                  </div>
                </Link>
                <button
                  className="edit-btn"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setEditStudent(s); }}
                  title="編集"
                >
                  ✎
                </button>
              </div>
            ))}
            <button className="add-student-btn" onClick={() => setShowAdd(true)}>
              ＋ 生徒を追加
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <AddStudentModal onClose={() => setShowAdd(false)} onSaved={handleStudentAdded} />
      )}

      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSaved={handleStudentEdited}
          onDeleted={handleStudentDeleted}
        />
      )}

      <Toast message={toast} onClear={() => setToast('')} />
    </>
  );
}
