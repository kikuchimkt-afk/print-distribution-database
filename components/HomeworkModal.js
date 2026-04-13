'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const SUBJECT_CLASS = { '数学': 'math', '英語': 'english', '国語': 'japanese', '理科': 'science', '社会': 'social', '英検': 'eiken' };

export default function HomeworkModal({ studentId, subjects, existingHomework, onClose, onSaved }) {
  const isEditing = !!existingHomework;
  
  const [subject, setSubject] = useState(existingHomework?.subject || subjects[0] || '');
  const [dueDate, setDueDate] = useState(existingHomework?.due_date || getTomorrowDate());
  const [title, setTitle] = useState(existingHomework?.title || '');
  const [description, setDescription] = useState(existingHomework?.description || '');
  const [saving, setSaving] = useState(false);

  // Slot file selection (PRIMARY)
  const [slotFiles, setSlotFiles] = useState([]);
  const [selectedFileIds, setSelectedFileIds] = useState(new Set());
  const [loadingSlots, setLoadingSlots] = useState(true);

  // New file upload (SECONDARY)  
  const [pendingFiles, setPendingFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('slots');
  const fileInputRef = useRef(null);

  // App links
  const [appLinks, setAppLinks] = useState(existingHomework?.homework_links || []);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');

  function getTomorrowDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  // Fetch existing slot files for this student
  useEffect(() => {
    async function fetchSlotFiles() {
      setLoadingSlots(true);
      const { data } = await supabase
        .from('slots')
        .select('*, files(*)')
        .eq('student_id', studentId)
        .neq('status', 'empty')
        .order('subject')
        .order('slot_number');

      const allFiles = [];
      for (const slot of (data || [])) {
        for (const file of (slot.files || [])) {
          allFiles.push({
            ...file,
            slotSubject: slot.subject,
            slotNumber: slot.slot_number,
            slotComment: slot.upload_comment,
          });
        }
      }
      setSlotFiles(allFiles);

      // Pre-select files if editing
      if (existingHomework?.homework_files) {
        const preSelected = new Set();
        for (const hf of existingHomework.homework_files) {
          if (hf.source_file_id) preSelected.add(hf.source_file_id);
        }
        setSelectedFileIds(preSelected);
      }

      setLoadingSlots(false);
    }
    fetchSlotFiles();
  }, [studentId, existingHomework]);

  function toggleFile(fileId) {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    setPendingFiles(prev => [...prev, ...files]);
    e.target.value = '';
  }

  function removePendingFile(idx) {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  }

  // App link management
  function addAppLink() {
    const url = newLinkUrl.trim();
    const linkTitle = newLinkTitle.trim() || url;
    if (!url) return;
    // Auto-add https if missing
    const fullUrl = url.startsWith('http') ? url : 'https://' + url;
    setAppLinks(prev => [...prev, { url: fullUrl, title: linkTitle, icon: '📱', _new: true }]);
    setNewLinkUrl('');
    setNewLinkTitle('');
  }

  function removeAppLink(idx) {
    setAppLinks(prev => prev.filter((_, i) => i !== idx));
  }

  function handleLinkKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addAppLink(); }
  }

  // Group slot files by subject
  const filesBySubject = {};
  slotFiles.forEach(f => {
    if (!filesBySubject[f.slotSubject]) filesBySubject[f.slotSubject] = [];
    filesBySubject[f.slotSubject].push(f);
  });

  const totalSelected = selectedFileIds.size + pendingFiles.length;
  const hasContent = totalSelected > 0 || appLinks.length > 0;

  async function handleSave() {
    if (!title.trim()) return;
    if (!hasContent) return;
    setSaving(true);

    try {
      let homeworkId = existingHomework?.id;

      if (isEditing) {
        await supabase
          .from('homework')
          .update({ subject, due_date: dueDate, title: title.trim(), description: description.trim() })
          .eq('id', homeworkId);
        // Delete old files and links
        await supabase.from('homework_files').delete().eq('homework_id', homeworkId);
        await supabase.from('homework_links').delete().eq('homework_id', homeworkId);
      } else {
        const { data: newHw, error } = await supabase
          .from('homework')
          .insert({
            student_id: studentId,
            subject,
            due_date: dueDate,
            title: title.trim(),
            description: description.trim(),
            assigned_by: '講師',
          })
          .select()
          .single();
        if (error) throw error;
        homeworkId = newHw.id;
      }

      // Insert selected slot files
      const selectedFiles = slotFiles.filter(f => selectedFileIds.has(f.id));
      if (selectedFiles.length > 0) {
        await supabase.from('homework_files').insert(
          selectedFiles.map(f => ({
            homework_id: homeworkId,
            file_path: f.file_path,
            file_name: f.file_name,
            file_size: f.file_size,
            source_file_id: f.id,
          }))
        );
      }

      // Upload new files
      for (const file of pendingFiles) {
        const timestamp = Date.now();
        const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';
        const safeName = `${timestamp}${ext}`;
        const filePath = `homework/${studentId}/${safeName}`;

        const { error: uploadErr } = await supabase.storage.from('prints').upload(filePath, file);
        if (uploadErr) throw uploadErr;

        await supabase.from('homework_files').insert({
          homework_id: homeworkId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          source_file_id: null,
        });
      }

      // Insert app links
      if (appLinks.length > 0) {
        await supabase.from('homework_links').insert(
          appLinks.map(link => ({
            homework_id: homeworkId,
            url: link.url,
            title: link.title,
            description: link.description || '',
            icon: link.icon || '📱',
          }))
        );
      }

      onSaved(isEditing ? '宿題を更新しました' : '宿題を追加しました');
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3>{isEditing ? '宿題を編集' : '📝 宿題を追加'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
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

          {/* File source tabs */}
          <div className="form-group">
            <label className="form-label">ファイル・アプリ選択</label>
            <div className="hw-source-tabs">
              <button
                className={`hw-source-tab ${activeTab === 'slots' ? 'active' : ''}`}
                onClick={() => setActiveTab('slots')}
              >
                📋 既存スロット
              </button>
              <button
                className={`hw-source-tab ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                📁 新規UP
              </button>
              <button
                className={`hw-source-tab ${activeTab === 'apps' ? 'active' : ''}`}
                onClick={() => setActiveTab('apps')}
              >
                📱 アプリ
              </button>
            </div>

            {activeTab === 'slots' ? (
              <div className="hw-slot-picker">
                {loadingSlots ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>
                    <div className="spinner"></div>
                  </div>
                ) : slotFiles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 13 }}>
                    アップロード済みのファイルがありません
                  </div>
                ) : (
                  Object.keys(filesBySubject).map(subj => (
                    <div key={subj} className="hw-slot-group">
                      <div className="hw-slot-group-header">
                        <span className={`subject-tag ${SUBJECT_CLASS[subj] || ''}`}>{subj}</span>
                      </div>
                      {filesBySubject[subj].map(file => (
                        <label
                          key={file.id}
                          className={`hw-file-option ${selectedFileIds.has(file.id) ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFileIds.has(file.id)}
                            onChange={() => toggleFile(file.id)}
                          />
                          <div className="hw-file-option-info">
                            <div className="hw-file-option-name">
                              第{file.slotNumber}回 — {file.file_name}
                            </div>
                            <div className="hw-file-option-meta">
                              {formatSize(file.file_size)}
                              {file.slotComment && ` · ${file.slotComment.slice(0, 40)}`}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'upload' ? (
              <div>
                <div
                  className="drop-zone"
                  style={{ padding: '20px 16px' }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDragEnter={e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                  onDragLeave={e => e.currentTarget.classList.remove('dragover')}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('dragover');
                    setPendingFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                  }}
                >
                  <div className="drop-icon-lg">📁</div>
                  <div className="drop-label">ファイルをD&Dまたはクリック</div>
                  <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
                </div>

                {pendingFiles.length > 0 && (
                  <div className="file-list">
                    {pendingFiles.map((file, i) => (
                      <div key={i} className="file-item" style={{ borderColor: 'var(--accent)', borderStyle: 'dashed' }}>
                        <div className="file-icon">📎</div>
                        <div className="file-details">
                          <div className="file-name">{file.name}</div>
                          <div className="file-meta">{formatSize(file.size)}</div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => removePendingFile(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Apps tab */
              <div className="hw-app-section">
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
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={addAppLink}
                    disabled={!newLinkUrl.trim()}
                  >
                    ＋
                  </button>
                </div>

                {appLinks.length > 0 ? (
                  <div className="hw-app-list">
                    {appLinks.map((link, i) => (
                      <div key={i} className="hw-app-item">
                        <span className="hw-app-icon">{link.icon || '📱'}</span>
                        <div className="hw-app-info">
                          <div className="hw-app-title">{link.title}</div>
                          <div className="hw-app-url">{link.url}</div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => removeAppLink(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>
                    当校で開発したアプリのURLを追加できます
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selection summary */}
          {hasContent && (
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, display: 'flex', gap: 12 }}>
              {totalSelected > 0 && <span>📄 {totalSelected}ファイル</span>}
              {appLinks.length > 0 && <span>📱 {appLinks.length}アプリ</span>}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>キャンセル</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !title.trim() || !hasContent}
          >
            {saving ? '保存中…' : isEditing ? '更新' : '宿題を追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
