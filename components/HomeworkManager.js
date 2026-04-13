'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import HomeworkModal from '@/components/HomeworkModal';

const SUBJECT_CLASS = { '数学': 'math', '英語': 'english', '国語': 'japanese', '理科': 'science', '社会': 'social', '英検': 'eiken' };

export default function HomeworkManager({ studentId, subjects, onToast }) {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHw, setEditingHw] = useState(null);

  const fetchHomework = useCallback(async () => {
    const { data } = await supabase
      .from('homework')
      .select('*, homework_files(*), homework_links(*)')
      .eq('student_id', studentId)
      .order('due_date', { ascending: true });
    setHomework(data || []);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { fetchHomework(); }, [fetchHomework]);

  // Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel(`homework-${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homework', filter: `student_id=eq.${studentId}` }, () => {
        fetchHomework();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [studentId, fetchHomework]);

  async function handleDelete(hw) {
    if (!confirm(`「${hw.title}」を削除しますか？`)) return;
    await supabase.from('homework_links').delete().eq('homework_id', hw.id);
    await supabase.from('homework_files').delete().eq('homework_id', hw.id);
    await supabase.from('homework').delete().eq('id', hw.id);
    fetchHomework();
    onToast('宿題を削除しました');
  }

  function handleSaved(msg) {
    fetchHomework();
    setShowModal(false);
    setEditingHw(null);
    onToast(msg);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${month}/${day}（${weekdays[d.getDay()]}）`;
  }

  function formatDateTime(isoStr) {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hour}:${min}`;
  }

  function getDueClass(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'today';
    if (diff <= 2) return 'soon';
    return '';
  }

  return (
    <div className="hw-manager">
      <div className="hw-manager-header">
        <h2 className="hw-manager-title">📝 宿題管理</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          ＋ 宿題を追加
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner"></div></div>
      ) : homework.length === 0 ? (
        <div className="hw-empty">
          <p>宿題はまだ登録されていません</p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
            「宿題を追加」から既存スロットのファイルやアプリを登録できます
          </p>
        </div>
      ) : (
        <div className="hw-list">
          {homework.map(hw => {
            const fileCount = hw.homework_files?.length || 0;
            const linkCount = hw.homework_links?.length || 0;
            const dueClass = getDueClass(hw.due_date);
            const firstViewed = formatDateTime(hw.first_viewed_at);
            const lastViewed = formatDateTime(hw.last_viewed_at);

            return (
              <div key={hw.id} className={`hw-item ${dueClass}`}>
                <div className="hw-item-main">
                  <div className="hw-item-top">
                    <span className={`subject-tag ${SUBJECT_CLASS[hw.subject] || ''}`}>{hw.subject}</span>
                    <span className={`hw-due ${dueClass}`}>{formatDate(hw.due_date)}</span>
                  </div>
                  <div className="hw-item-title">{hw.title}</div>
                  {hw.description && (
                    <div className="hw-item-desc">{hw.description}</div>
                  )}
                  <div className="hw-item-meta">
                    {fileCount > 0 && <span>📄 {fileCount}ファイル</span>}
                    {fileCount > 0 && linkCount > 0 && <span> · </span>}
                    {linkCount > 0 && <span>📱 {linkCount}アプリ</span>}
                    {hw.assigned_by && <span> · {hw.assigned_by}</span>}
                  </div>
                  {/* View tracking info */}
                  <div className="hw-view-tracking">
                    {firstViewed ? (
                      <>
                        <span className="hw-view-badge viewed">
                          👁 初見：{firstViewed}
                        </span>
                        <span className="hw-view-badge">
                          🕐 最終：{lastViewed}
                        </span>
                      </>
                    ) : (
                      <span className="hw-view-badge unviewed">未閲覧</span>
                    )}
                  </div>
                </div>
                <div className="hw-item-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditingHw(hw)}
                    title="編集"
                  >
                    ✎
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete(hw)}
                    title="削除"
                    style={{ color: 'var(--danger)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(showModal || editingHw) && (
        <HomeworkModal
          studentId={studentId}
          subjects={subjects}
          existingHomework={editingHw || null}
          onClose={() => { setShowModal(false); setEditingHw(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
