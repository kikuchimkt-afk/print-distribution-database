'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const SUBJECT_CLASS = { '数学': 'math', '英語': 'english', '国語': 'japanese', '理科': 'science', '社会': 'social', '英検': 'eiken' };
const AVATAR_COLORS = ['#2d6a4f','#3a7bd5','#e07a3a','#ad1457','#6a1b9a','#b5651d','#2e7d32','#c62828'];
const VIEW_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

export default function StudentLP() {
  const params = useParams();
  const studentId = params.id;

  const [student, setStudent] = useState(null);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('upcoming');

  // Engagement tracking refs
  const hwIdsRef = useRef([]);
  const activeTimeRef = useRef(0);
  const lastActiveRef = useRef(Date.now());
  const viewUpdatedRef = useRef(false);

  useEffect(() => {
    fetchData();
  }, [studentId]);

  // Engagement timer: track active (visible) time and update last_viewed_at after 15 min
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        // Page going hidden — accumulate active time
        activeTimeRef.current += Date.now() - lastActiveRef.current;
      } else {
        // Page becoming visible — reset checkpoint
        lastActiveRef.current = Date.now();
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);

    // Check every 30 seconds if threshold reached
    const interval = setInterval(() => {
      if (viewUpdatedRef.current) return;
      if (hwIdsRef.current.length === 0) return;

      // Accumulate current visible session time
      const currentActive = document.hidden
        ? activeTimeRef.current
        : activeTimeRef.current + (Date.now() - lastActiveRef.current);

      if (currentActive >= VIEW_THRESHOLD_MS) {
        viewUpdatedRef.current = true;
        const now = new Date().toISOString();
        supabase.from('homework')
          .update({ last_viewed_at: now })
          .in('id', hwIdsRef.current)
          .then(() => console.log('View tracked: 15min threshold reached'))
          .catch(e => console.warn('View tracking failed:', e));
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [studentRes, homeworkRes] = await Promise.all([
        supabase.from('students').select('*').eq('id', studentId).single(),
        supabase.from('homework').select('*, homework_files(*), homework_links(*)').eq('student_id', studentId).order('due_date', { ascending: true }),
      ]);
      if (studentRes.data) setStudent(studentRes.data);
      const hwData = homeworkRes.data || [];
      setHomework(hwData);

      // Store IDs for engagement tracking
      hwIdsRef.current = hwData.map(h => h.id);

      // Set first_viewed_at immediately for unviewed items
      if (hwData.length > 0) {
        const unviewed = hwData.filter(h => !h.first_viewed_at).map(h => h.id);
        if (unviewed.length > 0) {
          const now = new Date().toISOString();
          await supabase.from('homework')
            .update({ first_viewed_at: now })
            .in('id', unviewed)
            .catch(e => console.warn('First view tracking failed:', e));
        }
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
    setLoading(false);
  }

  function getFileUrl(filePath) {
    const { data } = supabase.storage.from('prints').getPublicUrl(filePath);
    return data.publicUrl;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[d.getDay()];
    return `${month}/${day}（${weekday}）`;
  }

  function getDueStatus(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'today';
    if (diff <= 2) return 'soon';
    return 'normal';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = homework.filter(h => {
    const due = new Date(h.due_date + 'T00:00:00');
    if (activeFilter === 'upcoming') return due >= today;
    if (activeFilter === 'past') return due < today;
    return true;
  });

  if (loading) {
    return (
      <div className="lp-container">
        <div className="lp-loading">
          <div className="spinner"></div>
          <p>読み込み中…</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="lp-container">
        <div className="lp-error">
          <div className="lp-error-icon">📋</div>
          <h2>ページが見つかりません</h2>
          <p>URLを確認してください</p>
        </div>
      </div>
    );
  }

  const color = AVATAR_COLORS[student.name.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <div className="lp-container">
      {/* Header */}
      <div className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-avatar" style={{ background: color }}>
            {student.name.charAt(0)}
          </div>
          <div className="lp-student-info">
            <h1 className="lp-student-name">{student.name}</h1>
            <div className="lp-student-meta">
              {student.grade}
              <span className="lp-dot">·</span>
              {(student.subjects || []).map(s => (
                <span key={s} className={`subject-tag ${SUBJECT_CLASS[s] || ''}`}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="lp-tabs">
        <button
          className={`lp-tab ${activeFilter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveFilter('upcoming')}
        >
          📌 これから
        </button>
        <button
          className={`lp-tab ${activeFilter === 'past' ? 'active' : ''}`}
          onClick={() => setActiveFilter('past')}
        >
          📁 過去
        </button>
        <button
          className={`lp-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          すべて
        </button>
      </div>

      {/* Homework list */}
      <div className="lp-content">
        {filtered.length === 0 ? (
          <div className="lp-empty">
            <div className="lp-empty-icon">📝</div>
            <p>{activeFilter === 'upcoming' ? '予定されている宿題はありません' : activeFilter === 'past' ? '過去の宿題はありません' : '宿題はまだ登録されていません'}</p>
          </div>
        ) : (
          <div className="lp-homework-list">
            {filtered.map(hw => {
              const dueStatus = getDueStatus(hw.due_date);
              const files = hw.homework_files || [];
              const links = hw.homework_links || [];

              return (
                <div key={hw.id} className={`lp-hw-card ${dueStatus}`}>
                  <div className="lp-hw-header">
                    <span className={`subject-tag ${SUBJECT_CLASS[hw.subject] || ''}`}>{hw.subject}</span>
                    <span className={`lp-due-badge ${dueStatus}`}>
                      {dueStatus === 'overdue' ? '期限切れ' : dueStatus === 'today' ? '今日まで' : dueStatus === 'soon' ? 'もうすぐ' : formatDate(hw.due_date)}
                    </span>
                  </div>

                  <h3 className="lp-hw-title">{hw.title}</h3>

                  {hw.description && (
                    <p className="lp-hw-desc">{hw.description}</p>
                  )}

                  <div className="lp-hw-due-date">
                    📅 期限：{formatDate(hw.due_date)}
                  </div>

                  {/* Files */}
                  {files.length > 0 && (
                    <div className="lp-file-list">
                      {files.map(file => (
                        <a
                          key={file.id}
                          href={getFileUrl(file.file_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lp-file-item"
                        >
                          <span className="lp-file-icon">📄</span>
                          <span className="lp-file-name">{file.file_name}</span>
                          <span className="lp-file-action">開く ›</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* App links */}
                  {links.length > 0 && (
                    <div className="lp-file-list" style={{ marginTop: files.length > 0 ? 6 : 0 }}>
                      {links.map(link => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lp-file-item lp-app-link"
                        >
                          <span className="lp-file-icon">{link.icon || '📱'}</span>
                          <span className="lp-file-name">{link.title}</span>
                          <span className="lp-file-action">起動 ›</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="lp-footer">
        <div className="lp-footer-logo">
          <div className="logo-icon" style={{ width: 20, height: 20, fontSize: 10 }}>P</div>
          <span>PrintBase</span>
        </div>
        <a href="/manual" target="_blank" rel="noopener" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', marginTop: 6 }}>
          📖 使い方ガイド
        </a>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          © {new Date().getFullYear()} ECC藍住・北島中央・大学前
        </div>
      </div>
    </div>
  );
}
