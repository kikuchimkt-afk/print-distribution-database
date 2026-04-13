'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const SUBJECT_CLASS = { '数学': 'math', '英語': 'english', '国語': 'japanese', '理科': 'science', '社会': 'social', '英検': 'eiken' };

export default function BatchHomeworkModal({ selectedStudents, onClose, onSaved }) {
  const [subject, setSubject] = useState('数学');
  const [dueDate, setDueDate] = useState(getTomorrowDate());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // File selection
  const [allSlotFiles, setAllSlotFiles] = useState([]);
  const [selectedFileIds, setSelectedFileIds] = useState(new Set());
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('slots');
  const fileInputRef = useRef(null);

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

  // Fetch slot files from ALL students (not just selected ones)
  useEffect(() => {
    async function fetchAllSlotFiles() {
      setLoadingSlots(true);
      const { data } = await supabase
        .from('slots')
        .select('*, files(*), students!inner(name)')
        .neq('status', 'empty')
        .order('subject')
        .order('slot_number');

      const files = [];
      for (const slot of (data || [])) {
        for (const file of (slot.files || [])) {
          files.push({
            ...file,
            slotSubject: slot.subject,
            slotNumber: slot.slot_number,
            studentName: slot.students?.name || '不明',
            studentId: slot.student_id,
          });
        }
      }
      setAllSlotFiles(files);
      setLoadingSlots(false);
    }
    fetchAllSlotFiles();
  }, []);

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

  // Group files by student → subject
  const filesByStudent = {};
  allSlotFiles.forEach(f => {
    const key = f.studentName;
    if (!filesByStudent[key]) filesByStudent[key] = {};
    if (!filesByStudent[key][f.slotSubject]) filesByStudent[key][f.slotSubject] = [];
    filesByStudent[key][f.slotSubject].push(f);
  });

  const totalFiles = selectedFileIds.size + pendingFiles.length;
  const hasContent = totalFiles > 0 || appLinks.length > 0;

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

    try {
      const selectedFiles = allSlotFiles.filter(f => selectedFileIds.has(f.id));
      let successCount = 0;

      // Upload new files once to shared location
      const uploadedFiles = [];
      for (const file of pendingFiles) {
        const timestamp = Date.now();
        const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';
        const safeName = `${timestamp}_${Math.random().toString(36).slice(2, 6)}${ext}`;
        const filePath = `homework/batch/${safeName}`;
        const { error: uploadErr } = await supabase.storage.from('prints').upload(filePath, file);
        if (uploadErr) throw uploadErr;
        uploadedFiles.push({ file_path: filePath, file_name: file.name, file_size: file.size });
      }

      for (const student of selectedStudents) {
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

        if (hwErr) { console.error(`Error for ${student.name}:`, hwErr); continue; }

        // Insert slot files
        if (selectedFiles.length > 0) {
          await supabase.from('homework_files').insert(
            selectedFiles.map(f => ({
              homework_id: newHw.id,
              file_path: f.file_path,
              file_name: f.file_name,
              file_size: f.file_size,
              source_file_id: f.id,
            }))
          );
        }

        // Insert uploaded files
        if (uploadedFiles.length > 0) {
          await supabase.from('homework_files').insert(
            uploadedFiles.map(f => ({
              homework_id: newHw.id,
              file_path: f.file_path,
              file_name: f.file_name,
              file_size: f.file_size,
              source_file_id: null,
            }))
          );
        }

        // Insert app links
        if (appLinks.length > 0) {
          await supabase.from('homework_links').insert(
            appLinks.map(link => ({
              homework_id: newHw.id,
              url: link.url,
              title: link.title,
              description: link.description || '',
              icon: link.icon || '📱',
            }))
          );
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
      <div className="modal" style={{ maxWidth: 640 }}>
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
            <input className="form-input" type="text" placeholder="例：教科書P.42〜45の問題" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">説明（任意）</label>
            <textarea className="form-textarea" placeholder="補足説明やメモ…" value={description} onChange={e => setDescription(e.target.value)} style={{ minHeight: 48 }} />
          </div>

          {/* File source tabs */}
          <div className="form-group">
            <label className="form-label">ファイル・アプリ選択</label>
            <div className="hw-source-tabs">
              <button className={`hw-source-tab ${activeTab === 'slots' ? 'active' : ''}`} onClick={() => setActiveTab('slots')}>
                📋 既存スロット
              </button>
              <button className={`hw-source-tab ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
                📁 新規UP
              </button>
              <button className={`hw-source-tab ${activeTab === 'apps' ? 'active' : ''}`} onClick={() => setActiveTab('apps')}>
                📱 アプリ
              </button>
            </div>

            {activeTab === 'slots' ? (
              <div className="hw-slot-picker">
                {loadingSlots ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>
                    <div className="spinner"></div>
                  </div>
                ) : allSlotFiles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 13 }}>
                    アップロード済みのファイルがありません
                  </div>
                ) : (
                  Object.keys(filesByStudent).map(studentName => (
                    <div key={studentName}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', padding: '8px 0 4px', borderBottom: '1px solid var(--border-light)' }}>
                        👤 {studentName}
                      </div>
                      {Object.keys(filesByStudent[studentName]).map(subj => (
                        <div key={subj} className="hw-slot-group">
                          <div className="hw-slot-group-header">
                            <span className={`subject-tag ${SUBJECT_CLASS[subj] || ''}`}>{subj}</span>
                          </div>
                          {filesByStudent[studentName][subj].map(file => (
                            <label key={file.id} className={`hw-file-option ${selectedFileIds.has(file.id) ? 'selected' : ''}`}>
                              <input type="checkbox" checked={selectedFileIds.has(file.id)} onChange={() => toggleFile(file.id)} />
                              <div className="hw-file-option-info">
                                <div className="hw-file-option-name">第{file.slotNumber}回 — {file.file_name}</div>
                                <div className="hw-file-option-meta">{formatSize(file.file_size)}</div>
                              </div>
                            </label>
                          ))}
                        </div>
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
              <div className="hw-app-section">
                <div className="hw-app-input-row">
                  <input className="form-input" type="text" placeholder="アプリ名" value={newLinkTitle} onChange={e => setNewLinkTitle(e.target.value)} style={{ flex: '0 0 120px' }} />
                  <input className="form-input" type="url" placeholder="https://example.com/app" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} onKeyDown={handleLinkKeyDown} style={{ flex: 1 }} />
                  <button className="btn btn-primary btn-sm" onClick={addAppLink} disabled={!newLinkUrl.trim()}>＋</button>
                </div>
                {appLinks.length > 0 ? (
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
                ) : (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>
                    当校で開発したアプリのURLを追加できます
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          {hasContent && (
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, display: 'flex', gap: 12 }}>
              {totalFiles > 0 && <span>📄 {totalFiles}ファイル</span>}
              {appLinks.length > 0 && <span>📱 {appLinks.length}アプリ</span>}
            </div>
          )}
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
