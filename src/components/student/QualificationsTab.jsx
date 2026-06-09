import { Edit3, Plus, Save, Trash2, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { useCallback, useEffect, useState, useRef } from 'react';
import { deleteStudentQualification, getStudentQualifications, saveStudentQualification } from '../../services/firestore';
import { StatusBadge } from '../StatusBadge';

const PROOF_IMAGE_ACCEPT = 'image/jpeg, image/jpg, image/png';

const EMPTY_RESULT = {
  title: '',
  institute: '',
  yearObtained: '',
  grade: '',
  percentage: '',
  notes: '',
};

export function ResultsTab({ user, legacyQualifications = [], legacyOtherQual = '' }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState('');
  const [draft, setDraft] = useState(EMPTY_RESULT);
  const [proofFile, setProofFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setResults(await getStudentQualifications(user.uid));
    } catch (err) {
      setError(err.message || 'Unable to load results.');
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreate() {
    setEditingId('new');
    setDraft(EMPTY_RESULT);
    setProofFile(null);
    setMessage('');
    setError('');
  }

  function startEdit(result) {
    setEditingId(result.id);
    setDraft({
      title: result.title || '',
      institute: result.institute || '',
      yearObtained: result.yearObtained || '',
      grade: result.grade || '',
      percentage: result.percentage || '',
      notes: result.notes || '',
    });
    setProofFile(null);
    setMessage('');
    setError('');
  }

  function patch(next) {
    setDraft((current) => ({ ...current, ...next }));
    setMessage('');
    setError('');
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) {
      setProofFile(null);
      return;
    }
    
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG).');
      event.target.value = '';
      setProofFile(null);
      return;
    }
    
    if (selectedFile.size > 2 * 1024 * 1024) {
       setError('Image must be smaller than 2 MB.');
       event.target.value = '';
       setProofFile(null);
       return;
    }

    setProofFile(selectedFile);
    setError('');
  }

  async function save() {
    if (!draft.title.trim()) {
      setError('Result title is required.');
      return;
    }
    
    if (draft.percentage && (Number(draft.percentage) < 0 || Number(draft.percentage) > 100)) {
       setError('Percentage must be between 0 and 100.');
       return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      await saveStudentQualification(user.uid, user, draft, proofFile, editingId === 'new' ? '' : editingId);
      setEditingId('');
      setDraft(EMPTY_RESULT);
      setProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await load();
      setMessage('Result saved.');
    } catch (err) {
      setError(err.message || 'Unable to save result.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(result) {
    const confirmed = window.confirm(`Remove "${result.title}" from your results?`);
    if (!confirmed) return;

    setDeletingId(result.id);
    setError('');
    setMessage('');
    try {
      await deleteStudentQualification(user.uid, result.id);
      await load();
      setMessage('Result removed.');
    } catch (err) {
      setError(err.message || 'Unable to remove result.');
    } finally {
      setDeletingId('');
    }
  }

  const hasLegacyQualifications = legacyQualifications.length > 0 || Boolean(legacyOtherQual);

  return (
    <section className="panel qualifications-panel">
      <div className="section-heading qualifications-heading">
        <div>
          <p className="eyebrow">Academic Record</p>
          <h2>Results & Qualifications</h2>
          <p>Submit your academic results with proof for Idara review.</p>
        </div>
        <button className="gold-button" type="button" onClick={startCreate}>
          <Plus size={16} />
          Add Result
        </button>
      </div>

      {editingId ? (
        <div className="qualification-form">
          <div className="form-grid">
            <label>
              Qualification Title
              <input value={draft.title} onChange={(event) => patch({ title: event.target.value })} placeholder="12th Grade, BSc, Hifz..." />
            </label>
            <label>
              Institute / Board / University
              <input value={draft.institute} onChange={(event) => patch({ institute: event.target.value })} />
            </label>
            <label>
              Year Obtained
              <input value={draft.yearObtained} onChange={(event) => patch({ yearObtained: event.target.value })} placeholder="e.g. 2024" />
            </label>
            <label>
              Grade / Result / Level
              <input value={draft.grade} onChange={(event) => patch({ grade: event.target.value })} placeholder="A+, First Class..." />
            </label>
            <label>
              % Obtained (0-100)
              <input type="number" min="0" max="100" step="0.01" value={draft.percentage} onChange={(event) => patch({ percentage: event.target.value })} placeholder="85.5" />
            </label>
          </div>
          
          <div className="form-grid">
             <label>
              Proof of Success (Image)
              <input ref={fileInputRef} type="file" accept={PROOF_IMAGE_ACCEPT} onChange={handleFileChange} />
              <span className="field-hint">Upload a JPG or PNG smaller than 2 MB.</span>
            </label>
          </div>
          {proofFile ? (
            <div className="file-chip" style={{marginBottom: '1rem'}}>
              <Upload size={15} />
              <span>{proofFile.name}</span>
            </div>
          ) : null}

          <label>
            Optional Notes
            <textarea value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} />
          </label>
          
          <div className="form-actions compact-actions">
            <button className="outline-button" type="button" onClick={() => setEditingId('')} disabled={saving}>
              <X size={16} />
              Cancel
            </button>
            <button className="gold-button" type="button" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={16} className="spin-icon" /> : <Save size={16} />}
              {saving ? 'Saving...' : editingId === 'new' ? 'Submit Result' : 'Update Result'}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <div className="notice danger">{error}</div> : null}
      {message ? <div className="notice success">{message}</div> : null}

      {loading ? (
        <div className="tashjee-empty compact-empty">Loading results...</div>
      ) : results.length ? (
        <div className="qualification-list">
          {results.map((result) => {
            const isPending = result.status === 'pending' || !result.status;
            return (
              <article className="qualification-card" key={result.id}>
                <div>
                  <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
                      <p style={{margin: 0}}>{result.title}</p>
                      {result.status ? <StatusBadge status={result.status} /> : <StatusBadge status="pending" />}
                    </div>
                    <button
                      className="icon-button request-delete-button"
                      type="button"
                      onClick={() => void remove(result)}
                      disabled={deletingId === result.id}
                      aria-label={`Remove ${result.title}`}
                      title="Delete Result"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3>{result.institute || 'Institute not provided'}</h3>
                  <span>
                    {[
                      result.yearObtained, 
                      result.grade, 
                      result.percentage ? `${result.percentage}%` : null
                    ].filter(Boolean).join(' · ') || 'Result details not provided'}
                  </span>
                  
                  {result.proofUrl ? (
                    <a href={result.proofUrl} target="_blank" rel="noreferrer" className="proof-link" style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', marginTop: '6px', color: 'var(--brand-gold)'}}>
                       <ImageIcon size={14} /> View Proof Image
                    </a>
                  ) : null}
                  
                  {result.notes ? <strong style={{marginTop: '8px', display: 'block'}}>{result.notes}</strong> : null}
                  
                  {result.adminNotes ? (
                     <div className="admin-note" style={{marginTop: '12px', padding: '8px', background: 'var(--bg-elevated)', borderRadius: '6px'}}>
                        <span style={{fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)'}}>Idara Note</span>
                        <p style={{margin: 0, fontSize: '0.85rem'}}>{result.adminNotes}</p>
                     </div>
                  ) : null}
                </div>
                
                {isPending ? (
                  <div className="qualification-actions">
                    <button className="icon-button" type="button" onClick={() => startEdit(result)} aria-label={`Edit ${result.title}`}>
                      <Edit3 size={15} />
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="tashjee-empty compact-empty">No results submitted yet.</div>
      )}

      {hasLegacyQualifications && !results.length ? (
        <div className="legacy-qualifications">
          <span>Legacy Registration Qualifications</span>
          <p>{[...legacyQualifications, legacyOtherQual].filter(Boolean).join(', ')}</p>
        </div>
      ) : null}
    </section>
  );
}
