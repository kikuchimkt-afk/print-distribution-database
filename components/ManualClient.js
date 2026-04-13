'use client';

import { useState } from 'react';
import Link from 'next/link';

const TEACHER_SECTIONS = [
  {
    id: 'overview',
    icon: '🏠',
    title: '全体の流れ',
    content: [
      { type: 'text', value: 'PrintBaseは、塾の講師が生徒ごとにプリントを管理し、宿題を配信するためのシステムです。' },
      { type: 'steps', value: [
        { emoji: '👤', text: '生徒を登録する' },
        { emoji: '📄', text: '各回のスロットにPDFをアップロード' },
        { emoji: '📝', text: '宿題として登録（個別 or 一括）' },
        { emoji: '📱', text: 'QRコードを生徒に共有' },
        { emoji: '👁', text: '閲覧状況を確認' },
      ]},
    ],
  },
  {
    id: 'student-management',
    icon: '👤',
    title: '生徒の管理',
    content: [
      { type: 'heading', value: '生徒を追加する' },
      { type: 'steps', value: [
        { emoji: '1️⃣', text: 'トップページ（生徒一覧）を開く' },
        { emoji: '2️⃣', text: '「＋ 生徒を追加」カードをクリック' },
        { emoji: '3️⃣', text: '名前・学年・教科を入力して保存' },
      ]},
      { type: 'heading', value: '生徒を編集・削除する' },
      { type: 'steps', value: [
        { emoji: '1️⃣', text: '生徒カードの右上「✎」ボタンをクリック' },
        { emoji: '2️⃣', text: '名前・学年・教科を編集して保存' },
        { emoji: '⚠️', text: '削除すると、その生徒のスロット・宿題・LPもすべて消えます' },
      ]},
    ],
  },
  {
    id: 'slots',
    icon: '📋',
    title: 'プリント管理（スロット）',
    content: [
      { type: 'text', value: '各生徒には教科ごとに第1回〜第24回のスロットがあります。' },
      { type: 'heading', value: 'PDFをアップロードする' },
      { type: 'steps', value: [
        { emoji: '1️⃣', text: '生徒カードをクリックして詳細ページを開く' },
        { emoji: '2️⃣', text: '教科タブで教科を切り替え' },
        { emoji: '3️⃣', text: '任意のスロット（第○回）をクリック' },
        { emoji: '4️⃣', text: 'PDFファイルをドラッグ＆ドロップ、またはクリックして選択' },
        { emoji: '5️⃣', text: '必要に応じてコメントを入力' },
      ]},
      { type: 'tip', value: '1つのスロットに複数ファイルをアップロードできます。' },
    ],
  },
  {
    id: 'homework',
    icon: '📝',
    title: '宿題の登録',
    content: [
      { type: 'heading', value: '個別の宿題登録' },
      { type: 'steps', value: [
        { emoji: '1️⃣', text: '生徒の詳細ページを開く' },
        { emoji: '2️⃣', text: 'ページ下部の「📝 宿題管理」セクションへ' },
        { emoji: '3️⃣', text: '「＋ 宿題を追加」をクリック' },
        { emoji: '4️⃣', text: '教科・期限・タイトルを入力' },
        { emoji: '5️⃣', text: 'ファイルを選択（3つの方法）：' },
      ]},
      { type: 'table', value: [
        ['📋 既存スロット', 'すでにアップロードしたPDFから選択', 'メイン'],
        ['📁 新規UP', '新しいPDFをアップロード', 'サブ'],
        ['📱 アプリ', '当校アプリのURLを登録', 'サブ'],
      ]},
      { type: 'heading', value: '一括宿題配信' },
      { type: 'steps', value: [
        { emoji: '1️⃣', text: 'トップページで「📝 一括宿題」ボタンをクリック' },
        { emoji: '2️⃣', text: '配信したい生徒をタップして選択（全選択も可能）' },
        { emoji: '3️⃣', text: '「📝 宿題を配信」ボタンで内容を入力' },
        { emoji: '4️⃣', text: '選択した全生徒に同じ宿題が配信されます' },
      ]},
    ],
  },
  {
    id: 'qr',
    icon: '📱',
    title: 'QRコード・LP',
    content: [
      { type: 'heading', value: 'QRコードを共有する' },
      { type: 'steps', value: [
        { emoji: '1️⃣', text: '生徒の詳細ページを開く' },
        { emoji: '2️⃣', text: '右上の「📱 QR」ボタンをクリック' },
        { emoji: '3️⃣', text: 'QRコードが表示されます' },
      ]},
      { type: 'table', value: [
        ['📋 URLをコピー', 'LINEやメールで共有'],
        ['🖼 画像保存', 'QR画像をダウンロード'],
        ['🖨 印刷', 'QRコードを印刷して配布'],
      ]},
      { type: 'tip', value: 'QRコードのURLは恒久的です。一度配布すれば、宿題を追加しても同じQRで最新情報が表示されます。' },
    ],
  },
  {
    id: 'tracking',
    icon: '👁',
    title: '閲覧トラッキング',
    content: [
      { type: 'text', value: '生徒がLPを開くと、自動的に閲覧情報が記録されます。' },
      { type: 'heading', value: '表示されるバッジ' },
      { type: 'badges', value: [
        { label: '👁 初見：4/13 13:05', color: 'viewed', desc: 'ページを初めて開いた日時' },
        { label: '🕐 最終：4/13 15:20', color: '', desc: '15分以上閲覧した最終日時' },
        { label: '未閲覧', color: 'unviewed', desc: 'まだページを開いていない' },
      ]},
      { type: 'tip', value: '「最終閲覧日」は15分以上ページを見続けた場合のみ更新されます。ちらっと見ただけでは記録されません。' },
    ],
  },
];

const STUDENT_SECTIONS = [
  {
    id: 's-access',
    icon: '📱',
    title: 'ページの開き方',
    content: [
      { type: 'text', value: '先生から共有されたQRコードを読み取るか、URLをタップしてページを開きます。' },
      { type: 'steps', value: [
        { emoji: '1️⃣', text: 'スマホのカメラでQRコードを読み取る' },
        { emoji: '2️⃣', text: '表示されたリンクをタップ' },
        { emoji: '3️⃣', text: '自分の宿題ページが開きます' },
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
      { type: 'heading', value: '表示される情報' },
      { type: 'steps', value: [
        { emoji: '📌', text: '教科と期限' },
        { emoji: '📄', text: '宿題のタイトルと説明' },
        { emoji: '🔴', text: '期限が近い・過ぎたものは色で警告' },
      ]},
      { type: 'heading', value: 'フィルタータブ' },
      { type: 'table', value: [
        ['📌 これから', 'まだ期限がきていない宿題'],
        ['📁 過去', '期限が過ぎた宿題'],
        ['すべて', '全部の宿題を表示'],
      ]},
    ],
  },
  {
    id: 's-pdf',
    icon: '📄',
    title: 'PDFの閲覧・印刷',
    content: [
      { type: 'heading', value: 'PDFを開く' },
      { type: 'steps', value: [
        { emoji: '1️⃣', text: '宿題カードの中にあるファイル名をタップ' },
        { emoji: '2️⃣', text: 'PDFが新しいタブで開きます' },
        { emoji: '3️⃣', text: 'スマホでそのまま閲覧できます' },
      ]},
      { type: 'heading', value: '印刷する方法' },
      { type: 'steps', value: [
        { emoji: '🖨', text: 'PDFを開いた状態で、ブラウザの共有ボタン → 「印刷」を選択' },
        { emoji: '📱', text: 'コンビニで印刷する場合は「ネットプリント」アプリを利用' },
      ]},
    ],
  },
  {
    id: 's-apps',
    icon: '📱',
    title: 'アプリの利用',
    content: [
      { type: 'text', value: '先生が登録した学習アプリも宿題ページに表示されます。' },
      { type: 'steps', value: [
        { emoji: '1️⃣', text: 'アプリ名が表示されたカードをタップ' },
        { emoji: '2️⃣', text: '「起動 ›」をタップするとアプリが開きます' },
        { emoji: '3️⃣', text: 'アプリで学習を進めましょう' },
      ]},
    ],
  },
];

function renderContent(items) {
  return items.map((item, i) => {
    switch (item.type) {
      case 'text':
        return <p key={i} className="manual-text">{item.value}</p>;
      case 'heading':
        return <h4 key={i} className="manual-subheading">{item.value}</h4>;
      case 'steps':
        return (
          <div key={i} className="manual-steps">
            {item.value.map((step, j) => (
              <div key={j} className="manual-step">
                <span className="manual-step-emoji">{step.emoji}</span>
                <span className="manual-step-text">{step.text}</span>
              </div>
            ))}
          </div>
        );
      case 'table':
        return (
          <div key={i} className="manual-table-wrap">
            <table className="manual-table">
              <tbody>
                {item.value.map((row, j) => (
                  <tr key={j}>
                    {row.map((cell, k) => <td key={k}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'tip':
        return (
          <div key={i} className="manual-tip">
            <span className="manual-tip-icon">💡</span>
            <span>{item.value}</span>
          </div>
        );
      case 'badges':
        return (
          <div key={i} className="manual-badges">
            {item.value.map((b, j) => (
              <div key={j} className="manual-badge-row">
                <span className={`hw-view-badge ${b.color}`}>{b.label}</span>
                <span className="manual-badge-desc">{b.desc}</span>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  });
}

export default function ManualClient() {
  const [activeTab, setActiveTab] = useState('teacher');
  const [activeSection, setActiveSection] = useState('overview');

  const sections = activeTab === 'teacher' ? TEACHER_SECTIONS : STUDENT_SECTIONS;
  const current = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/">生徒一覧</Link>
        <span className="sep">›</span>
        <span>マニュアル</span>
      </nav>

      <div className="manual-container">
        {/* Tab switcher */}
        <div className="manual-role-tabs">
          <button
            className={`manual-role-tab ${activeTab === 'teacher' ? 'active' : ''}`}
            onClick={() => { setActiveTab('teacher'); setActiveSection('overview'); }}
          >
            🧑‍🏫 講師用マニュアル
          </button>
          <button
            className={`manual-role-tab ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => { setActiveTab('student'); setActiveSection('s-access'); }}
          >
            🎒 生徒用マニュアル
          </button>
        </div>

        <div className="manual-layout">
          {/* Sidebar navigation */}
          <div className="manual-sidebar">
            {sections.map(s => (
              <button
                key={s.id}
                className={`manual-nav-item ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => setActiveSection(s.id)}
              >
                <span className="manual-nav-icon">{s.icon}</span>
                <span>{s.title}</span>
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="manual-content">
            <div className="manual-content-header">
              <span className="manual-content-icon">{current.icon}</span>
              <h2 className="manual-content-title">{current.title}</h2>
            </div>
            <div className="manual-content-body">
              {renderContent(current.content)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
