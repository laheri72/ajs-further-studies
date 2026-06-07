import { AlertCircle, Loader2, ShieldCheck, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { clearStudentRegistration, getExamProof, getStudentQualifications, updateStudentReview } from '../../services/firestore';
import { examProofStateLabel } from '../../utils/proofUpload';
import { LAPTOP_JUSTIFICATIONS } from '../../data/constants';

export function ReviewModal({ student, reviewer, onClose, onSaved, onCleared }) {
  const [status, setStatus] = useState(['pending', 'on-hold', 'approved'].includes(student.status) ? student.status : 'pending');
  const [adminNotes, setAdminNotes] = useState(student.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [qualifications, setQualifications] = useState([]);
  const [examProof, setExamProof] = useState(null);
  const [loadingRelated, setLoadingRelated] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoadingRelated(true);

    Promise.all([getStudentQualifications(student.id), getExamProof(student.id)])
      .then(([nextQualifications, nextExamProof]) => {
        if (!alive) return;
        setQualifications(nextQualifications);
        setExamProof(nextExamProof);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Unable to load related student details.');
      })
      .finally(() => {
        if (alive) setLoadingRelated(false);
      });

    return () => {
      alive = false;
    };
  }, [student.id]);

  async function save() {
    if (status === 'on-hold' && !adminNotes.trim()) {
      setError('Please add a note so the student knows what to clarify.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateStudentReview(student.id, reviewer, status, adminNotes);
      onSaved({ ...student, status, adminNotes, reviewedBy: reviewer.email });
    } catch (err) {
      setError(err.message || 'Unable to save review.');
      setSaving(false);
    }
  }

  async function clearRegistration() {
    const confirmed = window.confirm(
      `Permanently clear ${student.fullName || student.email}'s further-studies registration? They will be able to fill the form again from the start.`,
    );
    if (!confirmed) return;

    setSaving(true);
    setError('');
    try {
      await clearStudentRegistration(student.id);
      onCleared(student.id);
    } catch (err) {
      setError(err.message || 'Unable to clear this registration.');
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Review Record</p>
            <h2 id="review-title">{student.fullName}</h2>
            <p>{student.trNo} · {student.email}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close review modal">
            <X size={18} />
          </button>
        </header>

        <div className="detail-grid">
          {[
            ['Degree', student.degreeApplying],
            ['Institution', student.institution],
            ['Study Commitment', student.studyCommitment],
            ['Raza Days / Year', student.razaDays ? `${student.razaDays} days` : ''],
            ['Exam Months', student.examMonths?.join(', ')],
            ['Miqaat Clash', student.clashWithMiqaat ? `Yes - ${student.clashEvents?.join(', ') || 'Details provided'}` : 'No'],
            ['Laptop Requirement', student.needsLaptop ? `Yes - ${LAPTOP_JUSTIFICATIONS.find((j) => j.value === student.laptopJustification)?.label || student.laptopJustification}` : 'No'],
            ['Exam Proof', examProofStateLabel(examProof?.state)],
            ['Student Notes', student.additionalNotes],
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div className="detail-cell" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
        </div>

        <div className="detail-stack">
          <div className="detail-cell">
            <span>Qualifications</span>
            {loadingRelated ? (
              <strong className="inline-loading">
                <Loader2 size={14} className="spin-icon" />
                Loading qualifications...
              </strong>
            ) : qualifications.length ? (
              <div className="admin-qualification-list">
                {qualifications.map((qualification) => (
                  <strong key={qualification.id}>
                    {qualification.title}
                    {[qualification.institute, qualification.yearObtained, qualification.grade].filter(Boolean).length
                      ? ` · ${[qualification.institute, qualification.yearObtained, qualification.grade].filter(Boolean).join(' · ')}`
                      : ''}
                  </strong>
                ))}
              </div>
            ) : student.qualifications?.length || student.otherQual ? (
              <strong>{[...(student.qualifications || []), student.otherQual].filter(Boolean).join(', ')}</strong>
            ) : (
              <strong>No qualifications saved yet.</strong>
            )}
          </div>

          <div className="detail-cell">
            <span>Hall Ticket / Exam Proof</span>
            {loadingRelated ? (
              <strong className="inline-loading">
                <Loader2 size={14} className="spin-icon" />
                Loading proof...
              </strong>
            ) : examProof?.state === 'uploaded' ? (
              <div className="proof-preview-wrap">
                <img className="proof-preview" src={examProof.proofPreviewUrl || examProof.proofUrl} alt="Hall ticket proof preview" />
                <a href={examProof.proofPreviewUrl || examProof.proofUrl} target="_blank" rel="noreferrer">
                  Open hall ticket image
                </a>
              </div>
            ) : (
              <strong>{examProofStateLabel(examProof?.state)}</strong>
            )}
          </div>
        </div>

        <div className="split-choice modal-choice">
          {['pending', 'on-hold', 'approved'].map((nextStatus) => (
            <button
              className={`choice-card ${status === nextStatus ? 'selected' : ''}`}
              type="button"
              onClick={() => setStatus(nextStatus)}
              key={nextStatus}
            >
              {nextStatus === 'on-hold' ? <AlertCircle size={16} /> : <ShieldCheck size={16} />}
              {nextStatus === 'approved' ? 'Approved' : nextStatus === 'on-hold' ? 'On Hold' : 'Pending'}
            </button>
          ))}
        </div>

        <label>
          Notes visible to student {status === 'on-hold' ? '(required)' : ''}
          <textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} />
        </label>

        {error ? <div className="notice danger">{error}</div> : null}

        <div className="form-actions">
          <div className="modal-danger-actions">
            <button className="danger-button" type="button" onClick={clearRegistration} disabled={saving}>
              <Trash2 size={15} />
              Clear Registration
            </button>
          </div>
          <div className="modal-save-actions">
            <button className="outline-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="gold-button" type="button" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Review'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
