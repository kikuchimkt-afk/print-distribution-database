'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const SUBJECT_CLASS = { '数学': 'math', '英語': 'english', '国語': 'japanese', '理科': 'science', '社会': 'social', '英検': 'eiken' };
const VIEW_THRESHOLD_MS = 15 * 60 * 1000;

// Student manual data
const STUDENT_HELP = [
  {
    id: 's-access',
    icon: '📱',
    title: 'ページの開き方',
    content: [
      { type: 'text', value: '先生から共有されたQRコードを読み取るか、URLをタップしてページを開きます。' },
      { type: 'steps', items: [
        'スマホのカメラでQRコードを読み取る',
        '表示されたリンクをタップ',
        '自分の宿題ページが開きます',
      ]},
      { type: 'tip', value: 'ブックマークに追加しておくと、次回から簡単にアクセスできます。' },
    ],
  },
  {
    id: 's-homework',
    icon: '📝',
    title: '宿題の確認',
    content: [
      { type: 'text', value: 'ページには先生が登録した宿題の一覧が表示されます。' },
      { type: 'steps', items: [
        '📌 教科と期限が表示されます',
        '📄 タイトルと説明で内容がわかります',
        '🔴 期限が近い・過ぎたものは色で警告されます',
      ]},
      { type: 'text', value: 'タブで「これから」「過去」「すべて」を切り替えできます。' },
    ],
  },
  {
    id: 's-pdf',
    icon: '📄',
    title: 'PDFの閲覧・印刷',
    content: [
      { type: 'steps', items: [
        '宿題カードの中にあるファイル名をタップ',
        'PDFが新しいタブで開きます',
        'スマホでそのまま閲覧できます',
      ]},
      { type: 'tip', value: '印刷する場合は、ブラウザの共有ボタン → 「印刷」を選択してください。' },
    ],
  },
  {
    id: 's-apps',
    icon: '📱',
    title: 'アプリの利用',
    content: [
      { type: 'text', value: '先生が登録した学習アプリも宿題ページに表示されます。' },
      { type: 'steps', items: [
        'アプリ名が表示されたカードをタップ',
        '「起動 ›」をタップするとアプリが開きます',
      ]},
    ],
  },
];

export default function StudentLP() {
  const params = useParams();
  const studentId = params.id;

  const [student, setStudent] = useState(null);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [showHelp, setShowHelp] = useState(false);
  const [helpSection, setHelpSection] = useState('s-access');

  const hwIdsRef = useRef([]);
  const activeTimeRef = useRef(0);
  const lastActiveRef = useRef(Date.now());
  const viewUpdatedRef = useRef(false);

  useEffect(() => { fetchData(); }, [studentId]);

  // Engagement timer
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        activeTimeRef.current += Date.now() - lastActiveRef.current;
      } else {
        lastActiveRef.current = Date.now();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(() => {
      if (viewUpdatedRef.current || hwIdsRef.current.length === 0) return;
      const currentActive = document.hidden
        ? activeTimeRef.current
        : activeTimeRef.current + (Date.now() - lastActiveRef.current);
      if (currentActive >= VIEW_THRESHOLD_MS) {
        viewUpdatedRef.current = true;
        const now = new Date().toISOString();
        supabase.from('homework').update({ last_viewed_at: now }).in('id', hwIdsRef.current);
      }
    }, 30000);
    return () => { document.removeEventListener('visibilitychange', handleVisibility); clearInterval(interval); };
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
      hwIdsRef.current = hwData.map(h => h.id);

      if (hwData.length > 0) {
        const unviewed = hwData.filter(h => !h.first_viewed_at).map(h => h.id);
        if (unviewed.length > 0) {
          const now = new Date().toISOString();
          await supabase.from('homework').update({ first_viewed_at: now }).in('id', unviewed).select();
        }
      }
    } catch (e) { console.error('Fetch error:', e); }
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
    return `${month}/${day}（${weekdays[d.getDay()]}）`;
  }

  function getDueStatus(dateStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'today';
    if (diff <= 2) return 'soon';
    return 'normal';
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const filtered = homework.filter(h => {
    const due = new Date(h.due_date + 'T00:00:00');
    if (activeFilter === 'upcoming') return due >= today;
    if (activeFilter === 'past') return due < today;
    return true;
  });

  const currentHelp = STUDENT_HELP.find(s => s.id === helpSection) || STUDENT_HELP[0];

  if (loading) {
    return (
      <div className="lp-container">
        <div className="lp-forest-bg"></div>
        <div className="lp-loading"><div className="spinner"></div><p>読み込み中…</p></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="lp-container">
        <div className="lp-forest-bg"></div>
        <div className="lp-error">
          <div className="lp-error-icon">📋</div>
          <h2>ページが見つかりません</h2>
          <p>URLを確認してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lp-container">
      <div className="lp-forest-bg">
        <div className="lp-tree lp-tree-1">🌲</div>
        <div className="lp-tree lp-tree-2">🌳</div>
        <div className="lp-tree lp-tree-3">🌲</div>
        <div className="lp-tree lp-tree-4">🌳</div>
        <div className="lp-tree lp-tree-5">🌲</div>
        <div className="lp-tree lp-tree-6">🌳</div>
        <div className="lp-tree lp-tree-7">🌲</div>
        <div className="lp-tree lp-tree-8">🌳</div>
        <div className="lp-owl lp-owl-parent" title="フクロウお母さん">🦉</div>
        <div className="lp-owl lp-owl-boy" title="フクロウ男の子">🦉</div>
        <div className="lp-owl lp-owl-girl" title="フクロウ女の子">🦉</div>
      </div>

      {/* Header */}
      <div className="lp-header">
        <button className="lp-help-link" onClick={() => setShowHelp(true)}>📖 使い方</button>
        <h1 className="lp-main-title">🦉 宿題連絡帳</h1>
        <div className="lp-student-bar">
          <span className="lp-student-name-text">{student.name}</span>
          <span className="lp-student-meta-text">
            {student.grade}
            {(student.subjects || []).map(s => (
              <span key={s} className={`subject-tag ${SUBJECT_CLASS[s] || ''}`}>{s}</span>
            ))}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="lp-tabs">
        <button className={`lp-tab ${activeFilter === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveFilter('upcoming')}>📌 これから</button>
        <button className={`lp-tab ${activeFilter === 'past' ? 'active' : ''}`} onClick={() => setActiveFilter('past')}>📁 過去</button>
        <button className={`lp-tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>すべて</button>
      </div>

      {/* Content */}
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
                  {hw.description && <p className="lp-hw-desc">{hw.description}</p>}
                  <div className="lp-hw-due-date">📅 期限：{formatDate(hw.due_date)}</div>
                  {files.length > 0 && (
                    <div className="lp-file-list">
                      {files.map(file => (
                        <a key={file.id} href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="lp-file-item">
                          <span className="lp-file-icon">📄</span>
                          <span className="lp-file-name">{file.file_name}</span>
                          <span className="lp-file-action">開く ›</span>
                        </a>
                      ))}
                    </div>
                  )}
                  {links.length > 0 && (
                    <div className="lp-file-list" style={{ marginTop: files.length > 0 ? 6 : 0 }}>
                      {links.map(link => (
                        <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="lp-file-item lp-app-link">
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
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
          © {new Date().getFullYear()} ECC藍住・北島中央・大学前
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="lp-help-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowHelp(false); }}>
          <div className="lp-help-modal">
            <div className="lp-help-modal-header">
              <h2>📖 使い方ガイド</h2>
              <button className="lp-help-close" onClick={() => setShowHelp(false)}>✕</button>
            </div>
            <div className="lp-help-tabs">
              {STUDENT_HELP.map(s => (
                <button
                  key={s.id}
                  className={`lp-help-tab ${helpSection === s.id ? 'active' : ''}`}
                  onClick={() => setHelpSection(s.id)}
                >
                  {s.icon} {s.title}
                </button>
              ))}
            </div>
            <div className="lp-help-body">
              <h3 className="lp-help-section-title">{currentHelp.icon} {currentHelp.title}</h3>
              {currentHelp.content.map((item, i) => {
                if (item.type === 'text') return <p key={i} className="lp-help-text">{item.value}</p>;
                if (item.type === 'tip') return (
                  <div key={i} className="lp-help-tip">
                    <span>💡</span> <span>{item.value}</span>
                  </div>
                );
                if (item.type === 'steps') return (
                  <div key={i} className="lp-help-steps">
                    {item.items.map((step, j) => (
                      <div key={j} className="lp-help-step">
                        <span className="lp-help-step-num">{j + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                );
                return null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
