'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BatchHomeworkModal({ selectedStudents, onClose, onSaved }) {
  const [subject, setSubject] = useState('数学');
  const [dueDate, setDueDate] = useState(getTomorrowDate());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // App links
  const [appLinks, setAppLinks] = useState([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');

  const subjects = ['数学', '英語', '国語', '理科', '社会', '英検'];

  function getTomorrowDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  function addAppLink() {
    const url = newLinkUrl.trim();
    const linkTitle = newLinkTitle.trim() || url;
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : 'https://' + url;
    setAppLinks(prev => [...prev, { url: fullUrl, title: linkTitle, description: '', icon: '📱' }]);
    setNewLinkUrl('');
    setNewLinkTitle('');
  }

  function removeAppLink(idx) {
    setAppLinks(prev => prev.filter((_, i) => i !== idx));
  }

  function handleLinkKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addAppLink(); }
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

    try {
      let successCount = 0;

      for (const student of selectedStudents) {
        // Create homework for each student
        const { data: newHw, error: hwErr } = await supabase
          .from('homework')
          .insert({
            student_id: student.id,
            subject,
            due_date: dueDate,
            title: title.trim(),
            description: description.trim(),
            assigned_by: '講師',
          })
          .select()
          .single();

        if (hwErr) {
          console.error(`Error for ${student.name}:`, hwErr);
          continue;
        }

        // Insert app links for this homework
        if (appLinks.length > 0) {
          const { error: linkErr } = await supabase.from('homework_links').insert(
            appLinks.map(link => ({
              homework_id: newHw.id,
              url: link.url,
              title: link.title,
              description: link.description || '',
              icon: link.icon || '📱',
            }))
          );
          if (linkErr) console.error(`Link error for ${student.name}:`, linkErr);
        }

        successCount++;
      }

      onSaved(`${successCount}名の生徒に宿題を配信しました`);
    } catch (err) {
      console.error('Batch save error:', err);
      alert('保存に失敗しました: ' + (err.message || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3>📝 一括宿題配信</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Selected students summary */}
          <div className="batch-students-summary">
            <div className="batch-label">配信先（{selectedStudents.length}名）</div>
            <div className="batch-student-chips">
              {selectedStudents.map(s => (
                <span key={s.id} className="batch-student-chip">
                  {s.name}
                  <span className="batch-student-grade">{s.grade}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Basic info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">教科</label>
              <select className="form-input" value={subject} onChange={e => setSubject(e.target.value)}>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">期限</label>
              <input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">タイトル</label>
            <input
              className="form-input"
              type="text"
              placeholder="例：教科書P.42〜45の問題"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">説明（任意）</label>
            <textarea
              className="form-textarea"
              placeholder="補足説明やメモ…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ minHeight: 48 }}
            />
          </div>

          {/* App links */}
          <div className="form-group">
            <label className="form-label">📱 アプリリンク（任意）</label>
            <div className="hw-app-input-row">
              <input
                className="form-input"
                type="text"
                placeholder="アプリ名"
                value={newLinkTitle}
                onChange={e => setNewLinkTitle(e.target.value)}
                style={{ flex: '0 0 120px' }}
              />
              <input
                className="form-input"
                type="url"
                placeholder="https://example.com/app"
                value={newLinkUrl}
                onChange={e => setNewLinkUrl(e.target.value)}
                onKeyDown={handleLinkKeyDown}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary btn-sm" onClick={addAppLink} disabled={!newLinkUrl.trim()}>
                ＋
              </button>
            </div>
            {appLinks.length > 0 && (
              <div className="hw-app-list">
                {appLinks.map((link, i) => (
                  <div key={i} className="hw-app-item">
                    <span className="hw-app-icon">{link.icon}</span>
                    <div className="hw-app-info">
                      <div className="hw-app-title">{link.title}</div>
                      <div className="hw-app-url">{link.url}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeAppLink(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>キャンセル</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !title.trim()}
          >
            {saving ? '配信中…' : `${selectedStudents.length}名に配信`}
          </button>
        </div>
      </div>
    </div>
  );
}
