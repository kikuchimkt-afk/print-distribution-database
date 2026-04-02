'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const DEFAULT_SUBJECTS = ['数学', '英語', '国語', '理科', '社会', '英検'];
const GRADES = ['小5', '小6', '中1', '中2', '中3', '高1', '高2', '高3'];

export default function AddStudentModal({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('中1');
  const [subjects, setSubjects] = useState(['数学', '英語']);
  const [customSubject, setCustomSubject] = useState('');
  const [saving, setSaving] = useState(false);

  const allSubjects = [...new Set([...DEFAULT_SUBJECTS, ...subjects])];

  function toggleSubject(subj) {
    setSubjects(prev =>
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
    );
  }

  function addCustomSubject() {
    const trimmed = customSubject.trim();
    if (!trimmed || subjects.includes(trimmed)) return;
    setSubjects(prev => [...prev, trimmed]);
    setCustomSubject('');
  }

  function handleCustomKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addCustomSubject(); }
  }

  async function handleSave() {
    if (!name.trim()) return;
    if (subjects.length === 0) return;
    setSaving(true);

    const { error } = await supabase.from('students').insert({
      name: name.trim(),
      grade,
      subjects,
    });

    setSaving(false);
    if (!error) onSaved();
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h3>生徒を追加</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">生徒名</label>
            <input
              className="form-input"
              type="text"
              placeholder="例：山田 太郎"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
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
              {allSubjects.map(subj => (
                <label
                  key={subj}
                  className={`checkbox-label ${subjects.includes(subj) ? 'checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={subjects.includes(subj)}
                    onChange={() => toggleSubject(subj)}
                  />
                  {subj}
                </label>
              ))}
            </div>
            <div className="custom-subject-row">
              <input
                className="form-input"
                type="text"
                placeholder="教科を追加…"
                value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
                onKeyDown={handleCustomKeyDown}
              />
              <button className="btn btn-secondary btn-sm" onClick={addCustomSubject} disabled={!customSubject.trim()}>＋</button>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !name.trim() || subjects.length === 0}>
            {saving ? '保存中…' : '追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
