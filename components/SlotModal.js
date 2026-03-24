'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const EVAL_LABELS = ['要改善', 'もう少し', '良い', '大変良い'];

export default function SlotModal({ studentId, subject, slotNumber, slotData, droppedFiles, onClose, onSaved }) {
  const [pendingFiles, setPendingFiles] = useState(droppedFiles || []);
  const [comment, setComment] = useState(slotData?.upload_comment || '');
  const [evaluation, setEvaluation] = useState(slotData?.evaluation || null);
  const [evalComment, setEvalComment] = useState(slotData?.eval_comment || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isExisting = slotData && slotData.status !== 'empty';
  const existingFiles = slotData?.files || [];
  const isEvaluated = slotData?.status === 'evaluated';

  function handleDragOver(e) { e.preventDefault(); }
  function handleDragEnter(e) { e.preventDefault(); e.currentTarget.classList.add('dragover'); }
  function handleDragLeave(e) { e.currentTarget.classList.remove('dragover'); }

  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    setPendingFiles(prev => [...prev, ...files]);
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
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  }

  async function handleUpload() {
    if (pendingFiles.length === 0 && !isExisting) return;
    setSaving(true);
    setUploading(true);

    try {
      // Get or create slot
      let slotId = slotData?.id;
      if (!slotId) {
        const { data: newSlot, error: slotErr } = await supabase
          .from('slots')
          .insert({
            student_id: studentId,
            subject,
            slot_number: slotNumber,
            upload_comment: comment,
            uploaded_by: '講師',
            uploaded_at: new Date().toISOString(),
            status: 'uploaded',
          })
          .select()
          .single();
        if (slotErr) throw slotErr;
        slotId = newSlot.id;
      } else {
        // Update comment
        await supabase
          .from('slots')
          .update({
            upload_comment: comment,
            status: slotData.status === 'empty' ? 'uploaded' : slotData.status,
            uploaded_at: slotData.uploaded_at || new Date().toISOString(),
          })
          .eq('id', slotId);
      }

      // Upload each file
      for (const file of pendingFiles) {
        const timestamp = Date.now();
        const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';
        const safeName = `${timestamp}${ext}`;
        const filePath = `${studentId}/s${slotNumber}/${safeName}`;

        const { error: uploadErr } = await supabase.storage
          .from('prints')
          .upload(filePath, file);

        if (uploadErr) throw uploadErr;

        await supabase.from('files').insert({
          slot_id: slotId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          uploaded_by: '講師',
        });
      }

      // If uploading new files to a slot that was empty, update status
      if (pendingFiles.length > 0 && slotData?.status === 'empty') {
        await supabase
          .from('slots')
          .update({ status: 'uploaded' })
          .eq('id', slotId);
      }

      onSaved('アップロードしました');
    } catch (err) {
      console.error('Upload error:', err);
      alert('アップロードに失敗しました: ' + err.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function handleSaveEvaluation() {
    if (!evaluation) return;
    setSaving(true);

    try {
      await supabase
        .from('slots')
        .update({
          evaluation,
          eval_comment: evalComment,
          evaluated_by: '講師',
          evaluated_at: new Date().toISOString(),
          status: 'evaluated',
        })
        .eq('id', slotData.id);

      onSaved('評価を保存しました');
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload(file) {
    const { data } = supabase.storage.from('prints').getPublicUrl(file.file_path);
    window.open(data.publicUrl, '_blank');
  }

  async function handleDeleteFile(file) {
    if (!confirm(`${file.file_name} を削除しますか？`)) return;

    await supabase.storage.from('prints').remove([file.file_path]);
    await supabase.from('files').delete().eq('id', file.id);

    // Check remaining files
    const { data: remaining } = await supabase
      .from('files')
      .select('id')
      .eq('slot_id', slotData.id);

    if (!remaining || remaining.length === 0) {
      await supabase.from('slots').update({ status: 'empty' }).eq('id', slotData.id);
    }

    onSaved('ファイルを削除しました');
  }

  async function handleSaveComment() {
    setSaving(true);
    await supabase
      .from('slots')
      .update({ upload_comment: comment })
      .eq('id', slotData.id);
    setSaving(false);
    onSaved('コメントを保存しました');
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h3>{subject}　第{slotNumber}回</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Existing files */}
          {existingFiles.length > 0 && (
            <div className="file-list">
              {existingFiles.map(file => (
                <div key={file.id} className="file-item">
                  <div className="file-icon">📄</div>
                  <div className="file-details">
                    <div className="file-name">{file.file_name}</div>
                    <div className="file-meta">
                      {formatSize(file.file_size)}　·　{file.uploaded_by}　·　{file.uploaded_at?.slice(0, 10)}
                    </div>
                  </div>
                  <div className="file-actions">
                    <button className="btn btn-download btn-sm" onClick={() => handleDownload(file)}>↓ DL</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteFile(file)} title="削除">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending files */}
          {pendingFiles.length > 0 && (
            <div className="file-list" style={{ marginBottom: 12 }}>
              {pendingFiles.map((file, i) => (
                <div key={i} className="file-item" style={{ borderColor: 'var(--accent)', borderStyle: 'dashed' }}>
                  <div className="file-icon">📎</div>
                  <div className="file-details">
                    <div className="file-name">{file.name}</div>
                    <div className="file-meta">{formatSize(file.size)}　·　新規</div>
                  </div>
                  <div className="file-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => removePendingFile(i)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drop zone (always available for adding more files) */}
          <div
            className="drop-zone"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-icon-lg">📁</div>
            <div className="drop-label">ファイルをドラッグ＆ドロップ</div>
            <div className="drop-sublabel">またはクリックして選択（PDF, Word, 画像など · 複数可）</div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          {/* Comment */}
          <div className="form-group">
            <label className="form-label">授業の注意点・コメント</label>
            <textarea
              className="form-textarea"
              placeholder="この授業で注意すべき点、事前に伝えたいことなど…"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          {/* Evaluation section (only for uploaded/evaluated slots) */}
          {isExisting && (
            <div className="eval-section">
              <h4>{isEvaluated ? '授業評価' : '授業評価を入力'}</h4>
              <div className="eval-buttons">
                {[1, 2, 3, 4].map(score => (
                  <button
                    key={score}
                    className={`eval-btn ${evaluation === score ? 'selected' : ''}`}
                    data-score={score}
                    onClick={() => setEvaluation(score)}
                  >
                    <span className="eval-score">{score}</span>
                    <span className="eval-label">{EVAL_LABELS[score - 1]}</span>
                  </button>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">講師コメント</label>
                <textarea
                  className="form-textarea"
                  placeholder="授業の様子や改善点など…"
                  value={evalComment}
                  onChange={e => setEvalComment(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {isExisting && pendingFiles.length === 0 ? '閉じる' : 'キャンセル'}
          </button>

          {isExisting && pendingFiles.length === 0 ? (
            <>
              {comment !== (slotData?.upload_comment || '') && (
                <button className="btn btn-secondary" onClick={handleSaveComment} disabled={saving}>
                  コメント保存
                </button>
              )}
              <button className="btn btn-primary" onClick={handleSaveEvaluation} disabled={saving || !evaluation}>
                {saving ? '保存中…' : '評価を保存'}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleUpload} disabled={saving || (pendingFiles.length === 0 && !isExisting)}>
              {uploading ? 'アップロード中…' : 'アップロード'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
