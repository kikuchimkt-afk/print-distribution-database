'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SlotModal from '@/components/SlotModal';
import BatchModal from '@/components/BatchModal';
import QRCodeModal from '@/components/QRCodeModal';
import HomeworkManager from '@/components/HomeworkManager';
import Toast from '@/components/Toast';

const AVATAR_COLORS = ['#2d6a4f','#3a7bd5','#e07a3a','#ad1457','#6a1b9a','#b5651d','#2e7d32','#c62828'];
const SLOTS_PER_SUBJECT = 24;

export default function StudentClient() {
  const params = useParams();
  const studentId = params.id;

  const [student, setStudent] = useState(null);
  const [slots, setSlots] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBatch, setShowBatch] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStudent = useCallback(async () => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    if (data) {
      setStudent(data);
      if (!activeSubject && data.subjects?.length > 0) {
        setActiveSubject(data.subjects[0]);
      }
    }
    setLoading(false);
  }, [studentId, activeSubject]);

  const fetchSlots = useCallback(async () => {
    if (!activeSubject) return;
    const { data } = await supabase
      .from('slots')
      .select(`
        *,
        files (*)
      `)
      .eq('student_id', studentId)
      .eq('subject', activeSubject)
      .order('slot_number');
    setSlots(data || []);
  }, [studentId, activeSubject]);

  useEffect(() => { fetchStudent(); }, [fetchStudent]);
  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // ① リアルタイム同期
  useEffect(() => {
    const channel = supabase
      .channel(`slots-${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots', filter: `student_id=eq.${studentId}` }, () => {
        fetchSlots();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, () => {
        fetchSlots();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId, fetchSlots]);

  function getSlotData(slotNum) {
    return slots.find(s => s.slot_number === slotNum);
  }

  function handleSlotClick(slotNum) {
    setSelectedSlot(slotNum);
  }

  async function handleSlotSaved(msg) {
    await fetchSlots();
    setSelectedSlot(null);
    setToast(msg || '保存しました');
  }

  function handleDragOver(e) { e.preventDefault(); }
  function handleDragEnter(e) { e.preventDefault(); e.currentTarget.classList.add('dragover'); }
  function handleDragLeave(e) { e.currentTarget.classList.remove('dragover'); }
  function handleDrop(e, slotNum) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      setSelectedSlot({ num: slotNum, droppedFiles: Array.from(e.dataTransfer.files) });
    }
  }

  // ④ ファイル検索フィルター
  function matchesSearch(slot) {
    if (!fileSearch) return true;
    const q = fileSearch.toLowerCase();
    if (slot?.upload_comment?.toLowerCase().includes(q)) return true;
    if (slot?.files?.some(f => f.file_name.toLowerCase().includes(q))) return true;
    return false;
  }

  // ⑥ 印刷
  function handlePrint() {
    window.print();
  }

  if (loading) return <div className="main-content"><div className="loading"><div className="spinner"></div></div></div>;
  if (!student) return <div className="main-content"><p>生徒が見つかりません</p></div>;

  const color = AVATAR_COLORS[student.name.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/">生徒一覧</Link>
        <span className="sep">›</span>
        <span>{student.name}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowQR(true)}>📱 QR</button>
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>🖨️ 印刷</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowBatch(true)}>📋 一括配布</button>
        </div>
      </nav>

      <div className="main-content">
        <div className="portfolio-header">
          <div className="portfolio-avatar" style={{ background: color }}>
            {student.name.charAt(0)}
          </div>
          <div className="portfolio-info">
            <div className="student-name-lg">{student.name}</div>
            <div className="student-meta">{student.grade}　·　{student.subjects?.length || 0}教科</div>
          </div>
        </div>

        <div className="subject-tabs">
          {(student.subjects || []).map(subj => (
            <button
              key={subj}
              className={`subject-tab ${subj === activeSubject ? 'active' : ''}`}
              onClick={() => setActiveSubject(subj)}
            >
              {subj}
            </button>
          ))}
        </div>

        {/* ④ ファイル検索 */}
        <div className="controls-bar" style={{ marginBottom: 14 }}>
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="ファイル名・コメントで検索…"
              value={fileSearch}
              onChange={e => setFileSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="slot-grid">
          {Array.from({ length: SLOTS_PER_SUBJECT }, (_, i) => i + 1).map(num => {
            const slot = getSlotData(num);
            const status = slot?.status || 'empty';
            const fileCount = slot?.files?.length || 0;

            // ④ 検索でマッチしないスロットは非表示
            if (fileSearch && status !== 'empty' && !matchesSearch(slot)) return null;
            if (fileSearch && status === 'empty') return null;

            return (
              <div
                key={num}
                className={`slot-card ${status}`}
                onClick={() => handleSlotClick(num)}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, num)}
              >
                <div className="slot-header">
                  <span className="slot-number">第{num}回</span>
                  <span className={`slot-status ${status}`}>
                    {status === 'evaluated' ? '評価済' : status === 'uploaded' ? 'アップロード済' : '未登録'}
                  </span>
                </div>

                {status === 'empty' ? (
                  <div className="slot-empty-content">
                    <div className="drop-icon">📄</div>
                    <span>D&Dでアップロード</span>
                  </div>
                ) : (
                  <>
                    {fileCount > 0 && (
                      <div className="slot-file-name">{slot.files[0].file_name}</div>
                    )}
                    <div className="slot-comment-preview">{slot.upload_comment}</div>
                    {fileCount > 1 && (
                      <div className="slot-file-count">他{fileCount - 1}ファイル</div>
                    )}
                    {slot.evaluation && (
                      <div className="slot-eval-badge" style={{ color: `var(--eval-${slot.evaluation})` }}>
                        {'★'.repeat(slot.evaluation)}{'☆'.repeat(4 - slot.evaluation)}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Homework Manager Section */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px solid var(--border-light)' }}>
          <HomeworkManager
            studentId={studentId}
            subjects={student.subjects || []}
            onToast={setToast}
          />
        </div>
      </div>

      {selectedSlot !== null && (
        <SlotModal
          studentId={studentId}
          subject={activeSubject}
          slotNumber={typeof selectedSlot === 'object' ? selectedSlot.num : selectedSlot}
          slotData={getSlotData(typeof selectedSlot === 'object' ? selectedSlot.num : selectedSlot)}
          droppedFiles={typeof selectedSlot === 'object' ? selectedSlot.droppedFiles : null}
          onClose={() => setSelectedSlot(null)}
          onSaved={handleSlotSaved}
        />
      )}

      {showQR && (
        <QRCodeModal
          studentId={studentId}
          studentName={student.name}
          onClose={() => setShowQR(false)}
        />
      )}

      {showBatch && (
        <BatchModal
          studentId={studentId}
          subject={activeSubject}
          onClose={() => setShowBatch(false)}
          onSaved={(msg) => { fetchSlots(); setShowBatch(false); setToast(msg); }}
        />
      )}

      <Toast message={toast} onClear={() => setToast('')} />
    </>
  );
}
