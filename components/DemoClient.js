'use client';

import { useState } from 'react';
import Link from 'next/link';

// ====================================================
// DEMO DATA — 架空の生徒5名
// ====================================================
const DEMO_STUDENTS = [
  {
    id: 'demo-1',
    name: '田中 あおい',
    grade: '小6',
    subjects: ['数学', '英語'],
    slots: {
      '数学': [
        { number: 1, files: [{ name: '第1回 — 分数の計算.pdf', size: 245000 }], comment: '基礎固め' },
        { number: 2, files: [{ name: '第1回 — 分数の計算_解答.pdf', size: 128000 }], comment: '' },
        { number: 3, files: [{ name: '第2回 — 比と割合.pdf', size: 310000 }], comment: '応用問題多め' },
      ],
      '英語': [
        { number: 1, files: [{ name: '第1回 — アルファベット練習.pdf', size: 180000 }], comment: '' },
        { number: 2, files: [{ name: '第1回 — あいさつ表現.pdf', size: 220000 }], comment: '' },
      ],
    },
    homework: [
      { title: '分数のたし算・ひき算プリント', subject: '数学', due: '2026/04/18', files: ['第1回 — 分数の計算.pdf'], viewed: true },
      { title: 'あいさつ英語ドリル', subject: '英語', due: '2026/04/20', files: ['第1回 — あいさつ表現.pdf'], viewed: false },
    ],
  },
  {
    id: 'demo-2',
    name: '山本 はると',
    grade: '中1',
    subjects: ['数学', '英語'],
    slots: {
      '数学': [
        { number: 1, files: [{ name: '第1回 — 正負の数.pdf', size: 340000 }], comment: '教科書P.12〜' },
        { number: 2, files: [{ name: '第1回 — 正負の数_解答.pdf', size: 150000 }], comment: '' },
        { number: 3, files: [{ name: '第2回 — 文字の式.pdf', size: 290000 }], comment: '' },
        { number: 4, files: [{ name: '第2回 — 文字の式_解答.pdf', size: 140000 }], comment: '' },
      ],
      '英語': [
        { number: 1, files: [{ name: '第1回 — I am / You are.pdf', size: 250000 }], comment: 'Unit1' },
        { number: 2, files: [{ name: '第1回 — I am / You are_解答.pdf', size: 130000 }], comment: '' },
      ],
    },
    homework: [
      { title: '正負の数 演習プリント', subject: '数学', due: '2026/04/17', files: ['第1回 — 正負の数.pdf', '第1回 — 正負の数_解答.pdf'], viewed: true },
      { title: 'Unit1 文法ドリル', subject: '英語', due: '2026/04/19', files: ['第1回 — I am / You are.pdf'], viewed: true },
    ],
  },
  {
    id: 'demo-3',
    name: '佐藤 ゆい',
    grade: '中2',
    subjects: ['数学', '英語', '英検'],
    isSpecial: true, // ← この生徒に後で実PDFを入れる
    slots: {
      '数学': [
        { number: 1, files: [{ name: '第1回 — 式の展開.pdf', size: 380000 }], comment: '定期テスト範囲' },
        { number: 2, files: [{ name: '第1回 — 式の展開_解答.pdf', size: 160000 }], comment: '' },
      ],
      '英語': [
        { number: 1, files: [{ name: '第1回 — 不定詞.pdf', size: 320000 }], comment: '' },
      ],
      '英検': [
        { number: 1, files: [{ name: '英検3級 過去問 2025-1.pdf', size: 520000 }], comment: '第1回' },
      ],
    },
    homework: [
      { title: '式の展開 テスト対策', subject: '数学', due: '2026/04/16', files: ['第1回 — 式の展開.pdf'], viewed: true },
      { title: '英検3級 リーディング', subject: '英検', due: '2026/04/20', files: ['英検3級 過去問 2025-1.pdf'], viewed: false },
    ],
  },
  {
    id: 'demo-4',
    name: '高橋 そうた',
    grade: '中3',
    subjects: ['数学', '英語'],
    slots: {
      '数学': [
        { number: 1, files: [{ name: '第1回 — 二次方程式.pdf', size: 410000 }], comment: '入試頻出' },
        { number: 2, files: [{ name: '第1回 — 二次方程式_解答.pdf', size: 175000 }], comment: '' },
        { number: 3, files: [{ name: '第2回 — 二次関数.pdf', size: 350000 }], comment: '' },
      ],
      '英語': [
        { number: 1, files: [{ name: '第1回 — 関係代名詞.pdf', size: 280000 }], comment: '' },
        { number: 2, files: [{ name: '第2回 — 長文読解①.pdf', size: 400000 }], comment: '入試レベル' },
      ],
    },
    homework: [
      { title: '受験数学 二次方程式', subject: '数学', due: '2026/04/15', files: ['第1回 — 二次方程式.pdf'], viewed: true },
    ],
  },
  {
    id: 'demo-5',
    name: '伊藤 さくら',
    grade: '高1',
    subjects: ['数学', '英語'],
    slots: {
      '数学': [
        { number: 1, files: [{ name: '第1回 — 数と式.pdf', size: 450000 }], comment: '' },
        { number: 2, files: [{ name: '第1回 — 数と式_解答.pdf', size: 190000 }], comment: '' },
      ],
      '英語': [
        { number: 1, files: [{ name: '第1回 — 時制の総復習.pdf', size: 300000 }], comment: '' },
      ],
    },
    homework: [
      { title: '数と式 基礎演習', subject: '数学', due: '2026/04/18', files: ['第1回 — 数と式.pdf'], viewed: false },
      { title: '時制ドリル', subject: '英語', due: '2026/04/19', files: ['第1回 — 時制の総復習.pdf'], viewed: false },
    ],
  },
];

const SUBJECT_CLASS = { '数学': 'math', '英語': 'english', '国語': 'japanese', '理科': 'science', '社会': 'social', '英検': 'eiken' };

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}

// ====================================================
// DEMO STUDENT LIST VIEW
// ====================================================
function DemoStudentList({ onSelect }) {
  return (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h1 className="page-title" style={{ margin: 0 }}>生徒一覧</h1>
        <span className="demo-badge">DEMO</span>
      </div>
      <p className="page-subtitle">{DEMO_STUDENTS.length}名の生徒（デモデータ）</p>

      <div className="student-grid">
        {DEMO_STUDENTS.map(s => (
          <div key={s.id} className="student-card" style={{ cursor: 'pointer' }} onClick={() => onSelect(s)}>
            <div className="student-name">{s.name}</div>
            <div className="student-grade">{s.grade}</div>
            <div className="subject-tags">
              {s.subjects.map(subj => (
                <span key={subj} className={`subject-tag ${SUBJECT_CLASS[subj] || ''}`}>{subj}</span>
              ))}
            </div>
            {s.isSpecial && <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 4 }}>★ PDFデモ用</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ====================================================
// DEMO STUDENT DETAIL VIEW
// ====================================================
function DemoStudentDetail({ student, onBack }) {
  const [activeSubject, setActiveSubject] = useState(student.subjects[0]);

  const currentSlots = student.slots[activeSubject] || [];

  return (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '4px 8px' }}>← 戻る</button>
        <span className="demo-badge">DEMO</span>
      </div>

      <h1 className="page-title">{student.name}</h1>
      <p className="page-subtitle">{student.grade} — {student.subjects.join('・')}</p>

      {/* Subject tabs */}
      <div className="subject-tabs">
        {student.subjects.map(subj => (
          <button
            key={subj}
            className={`subject-tab ${subj === activeSubject ? 'active' : ''}`}
            onClick={() => setActiveSubject(subj)}
          >
            {subj}
          </button>
        ))}
      </div>

      {/* Slots */}
      <div className="slot-grid" style={{ marginTop: 16 }}>
        {Array.from({ length: 6 }, (_, i) => {
          const slotData = currentSlots.find(s => s.number === i + 1);
          const hasFiles = slotData && slotData.files.length > 0;

          return (
            <div key={i} className={`slot-card ${hasFiles ? 'uploaded' : ''}`}>
              <div className="slot-header">
                <span className="slot-number">第{i + 1}回</span>
                {hasFiles && <span className="slot-status uploaded">アップロード済</span>}
                {!hasFiles && <span className="slot-status empty">未アップロード</span>}
              </div>
              {hasFiles && (
                <div className="file-list">
                  {slotData.files.map((f, j) => (
                    <div key={j} className="file-item">
                      <div className="file-icon">📄</div>
                      <div className="file-details">
                        <div className="file-name">{f.name}</div>
                        <div className="file-meta">{formatSize(f.size)}</div>
                      </div>
                    </div>
                  ))}
                  {slotData.comment && (
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      💬 {slotData.comment}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Homework section */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📝 宿題管理</h2>
        {student.homework.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>宿題はまだありません</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {student.homework.map((hw, i) => (
              <div key={i} className="slot-card uploaded" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className={`subject-tag ${SUBJECT_CLASS[hw.subject] || ''}`} style={{ fontSize: 11 }}>{hw.subject}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>期限: {hw.due}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{hw.title}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {hw.files.map((f, j) => (
                    <span key={j} style={{ fontSize: 11, color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 8px', borderRadius: 4 }}>
                      📄 {f}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                  {hw.viewed ? (
                    <span className="hw-view-badge viewed">👁 初見：4/12 18:30</span>
                  ) : (
                    <span className="hw-view-badge unviewed">未閲覧</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code demo */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📱 QRコード</h2>
        <div style={{ padding: 20, background: 'var(--bg)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
          <div style={{ fontSize: 80, marginBottom: 8 }}>📱</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            実際の運用では、ここにQRコードが表示されます。<br />
            生徒・保護者はスマホで読み取って宿題を確認できます。
          </p>
        </div>
      </div>
    </div>
  );
}

// ====================================================
// DEMO LP (Student view)
// ====================================================
function DemoLP({ student, onBack }) {
  return (
    <div className="main-content" style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 12 }}>
        ← 講師画面に戻る
      </button>
      <span className="demo-badge" style={{ marginLeft: 8 }}>生徒視点プレビュー</span>

      <div className="lp-header" style={{ borderRadius: 'var(--radius)', marginTop: 12 }}>
        <div className="lp-header-inner">
          <div className="lp-avatar">{student.name.charAt(0)}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{student.name}</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{student.grade}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        {student.homework.map((hw, i) => {
          const isOverdue = false;
          return (
            <div key={i} className="lp-hw-card" style={{ marginBottom: 12, padding: 16, background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className={`subject-tag ${SUBJECT_CLASS[hw.subject] || ''}`}>{hw.subject}</span>
                <span style={{ fontSize: 12, color: isOverdue ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                  📅 {hw.due}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{hw.title}</div>
              {hw.files.map((f, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg)', borderRadius: 6, marginBottom: 4, cursor: 'pointer' }}>
                  <span>📄</span>
                  <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>{f}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)' }}>タップで開く ›</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-tertiary)' }}>
        📱 これが生徒のスマホに表示される画面です
      </div>
    </div>
  );
}

// ====================================================
// MAIN DEMO CLIENT
// ====================================================
export default function DemoClient() {
  const [view, setView] = useState('list');
  const [selectedStudent, setSelectedStudent] = useState(null);

  function selectStudent(student) {
    setSelectedStudent(student);
    setView('detail');
  }

  function showLP() {
    setView('lp');
  }

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/">生徒一覧</Link>
        <span className="sep">›</span>
        <span>デモモード</span>
        {view === 'detail' && selectedStudent && (
          <>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={showLP}>📱 生徒視点プレビュー</button>
            </div>
          </>
        )}
      </nav>

      {view === 'list' && (
        <DemoStudentList onSelect={selectStudent} />
      )}

      {view === 'detail' && selectedStudent && (
        <DemoStudentDetail student={selectedStudent} onBack={() => setView('list')} />
      )}

      {view === 'lp' && selectedStudent && (
        <DemoLP student={selectedStudent} onBack={() => setView('detail')} />
      )}
    </>
  );
}
