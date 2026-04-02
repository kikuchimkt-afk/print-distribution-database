'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function BatchModal({ studentId, subject, onClose, onSaved }) {
  const [slots, setSlots] = useState([]);
  const [files, setFiles] = useState([]);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  function toggleSlot(num) {
    setSlots(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a, b) => a - b));
  }

  function selectRange(from, to) {
    const range = [];
    for (let i = from; i <= to; i++) range.push(i);
    setSlots(range);
  }

  function handleFileSelect(e) {
    setFiles(Array.from(e.target.files));
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  }

  async function handleBatchUpload() {
    if (slots.length === 0 || files.length === 0) return;
    setSaving(true);

    try {
      for (const slotNum of slots) {
        // Create slot
        const { data: newSlot, error: slotErr } = await supabase
          .from('slots')
          .upsert({
            student_id: studentId,
            subject,
            slot_number: slotNum,
            upload_comment: comment,
            uploaded_by: '講師',
            uploaded_at: new Date().toISOString(),
            status: 'uploaded',
          }, { onConflict: 'student_id,subject,slot_number' })
          .select()
          .single();

        if (slotErr) throw slotErr;

        // Upload files for this slot
        for (const file of files) {
          const timestamp = Date.now();
          const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';
          const safeName = `${timestamp}${ext}`;
          const filePath = `${studentId}/s${slotNum}/${safeName}`;

          const { error: uploadErr } = await supabase.storage
            .from('prints')
            .upload(filePath, file);

          if (uploadErr) throw uploadErr;

          await supabase.from('files').insert({
            slot_id: newSlot.id,
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            uploaded_by: '講師',
          });
        }
      }

      onSaved(`${slots.length}スロットに一括配布しました`);
    } catch (err) {
      console.error(err);
      alert('一括配布に失敗しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h3>📋 一括配布 — {subject}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">配布先スロットを選択</label>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => selectRange(1, 12)}>1〜12回</button>
              <button className="btn btn-ghost btn-sm" onClick={() => selectRange(13, 24)}>13〜24回</button>
              <button className="btn btn-ghost btn-sm" onClick={() => selectRange(1, 24)}>全選択</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSlots([])}>解除</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
              {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  className={`btn btn-sm ${slots.includes(num) ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleSlot(num)}
                  style={{ padding: '6px 0', fontSize: 12 }}
                >
                  {num}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
              {slots.length > 0 ? `${slots.length}スロット選択中` : 'スロットを選択してください'}
            </div>
          </div>

          <div
            className="drop-zone"
            onDragOver={e => e.preventDefault()}
            onDragEnter={e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
            onDragLeave={e => e.currentTarget.classList.remove('dragover')}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-icon-lg">📁</div>
            <div className="drop-label">配布するファイルをD&D</div>
            <div className="drop-sublabel">{files.length > 0 ? `${files.length}ファイル選択済み` : '選択したすべてのスロットに同じファイルをアップロード'}</div>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
          </div>

          {files.length > 0 && (
            <div className="file-list">
              {files.map((f, i) => (
                <div key={i} className="file-item" style={{ borderColor: 'var(--accent)', borderStyle: 'dashed' }}>
                  <div className="file-icon">📎</div>
                  <div className="file-details">
                    <div className="file-name">{f.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">コメント（全スロット共通）</label>
            <textarea
              className="form-textarea"
              placeholder="授業の注意点など…"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={handleBatchUpload} disabled={saving || slots.length === 0 || files.length === 0}>
            {saving ? '配布中…' : `${slots.length}スロットに一括配布`}
          </button>
        </div>
      </div>
    </div>
  );
}
