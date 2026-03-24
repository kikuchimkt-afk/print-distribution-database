'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SlotModal from '@/components/SlotModal';
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

  if (loading) return <div className="main-content"><div className="loading"><div className="spinner"></div></div></div>;
  if (!student) return <div className="main-content"><p>生徒が見つかりません</p></div>;

  const color = AVATAR_COLORS[student.name.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/">生徒一覧</Link>
        <span className="sep">›</span>
        <span>{student.name}</span>
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

        <div className="slot-grid">
          {Array.from({ length: SLOTS_PER_SUBJECT }, (_, i) => i + 1).map(num => {
            const slot = getSlotData(num);
            const status = slot?.status || 'empty';
            const fileCount = slot?.files?.length || 0;

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

      <Toast message={toast} onClear={() => setToast('')} />
    </>
  );
}
