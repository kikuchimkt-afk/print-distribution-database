'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const ALL_SUBJECTS = ['数学', '英語', '国語', '理科', '社会'];
const GRADES = ['小5', '小6', '中1', '中2', '中3', '高1', '高2', '高3'];

export default function EditStudentModal({ student, onClose, onSaved, onDeleted }) {
  const [name, setName] = useState(student.name);
  const [grade, setGrade] = useState(student.grade);
  const [subjects, setSubjects] = useState(student.subjects || []);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function toggleSubject(subj) {
    setSubjects(prev =>
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
    );
  }

  async function handleSave() {
    if (!name.trim() || subjects.length === 0) return;
    setSaving(true);

    const { error } = await supabase
      .from('students')
      .update({ name: name.trim(), grade, subjects })
      .eq('id', student.id);

    setSaving(false);
    if (!error) onSaved();
  }

  async function handleDelete() {
    setSaving(true);
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', student.id);
    setSaving(false);
    if (!error) onDeleted();
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h3>生徒を編集</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">生徒名</label>
            <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">学年</label>
            <select className="form-input" value={grade} onChange={e => setGrade(e.target.value)}>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">教科</label>
            <div className="checkbox-group">
              {ALL_SUBJECTS.map(subj => (
                <label key={subj} className={`checkbox-label ${subjects.includes(subj) ? 'checked' : ''}`}>
                  <input type="checkbox" checked={subjects.includes(subj)} onChange={() => toggleSubject(subj)} />
                  {subj}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
            {confirmDelete ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--danger)' }}>本当に削除しますか？</span>
                <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={saving}>削除する</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>戻る</button>
              </div>
            ) : (
              <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>この生徒を削除</button>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !name.trim() || subjects.length === 0}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
