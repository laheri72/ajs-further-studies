import { Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { deleteStudentQualification, getStudentQualifications, saveStudentQualification } from '../../services/firestore';

const EMPTY_QUALIFICATION = {
  title: '',
  institute: '',
  yearObtained: '',
  grade: '',
  notes: '',
};

export function QualificationsTab({ user, legacyQualifications = [], legacyOtherQual = '' }) {
  const [qualifications, setQualifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState('');
  const [draft, setDraft] = useState(EMPTY_QUALIFICATION);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setQualifications(await getStudentQualifications(user.uid));
    } catch (err) {
      setError(err.message || 'Unable to load qualifications.');
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreate() {
    setEditingId('new');
    setDraft(EMPTY_QUALIFICATION);
    setMessage('');
    setError('');
  }

  function startEdit(qualification) {
    setEditingId(qualification.id);
    setDraft({
      title: qualification.title || '',
      institute: qualification.institute || '',
      yearObtained: qualification.yearObtained || '',
      grade: qualification.grade || '',
      notes: qualification.notes || '',
    });
    setMessage('');
    setError('');
  }

  function patch(next) {
    setDraft((current) => ({ ...current, ...next }));
    setMessage('');
    setError('');
  }

  async function save() {
    if (!draft.title.trim()) {
      setError('Qualification title is required.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      await saveStudentQualification(user.uid, draft, editingId === 'new' ? '' : editingId);
      setEditingId('');
      setDraft(EMPTY_QUALIFICATION);
      await load();
      setMessage('Qualification saved.');
    } catch (err) {
      setError(err.message || 'Unable to save qualification.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(qualification) {
    const confirmed = window.confirm(`Remove "${qualification.title}" from your qualifications?`);
    if (!confirmed) return;

    setDeletingId(qualification.id);
    setError('');
    setMessage('');
    try {
      await deleteStudentQualification(user.uid, qualification.id);
      await load();
      setMessage('Qualification removed.');
    } catch (err) {
      setError(err.message || 'Unable to remove qualification.');
    } finally {
      setDeletingId('');
    }
  }

  const hasLegacyQualifications = legacyQualifications.length > 0 || Boolean(legacyOtherQual);

  return (
    <section className="panel qualifications-panel">
      <div className="section-heading qualifications-heading">
        <div>
          <p className="eyebrow">Academic History</p>
          <h2>Qualifications</h2>
          <p>Maintain your academic record separately from the further-studies raza registration.</p>
        </div>
        <button className="gold-button" type="button" onClick={startCreate}>
          <Plus size={16} />
          Add Qualification
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
              <input value={draft.yearObtained} onChange={(event) => patch({ yearObtained: event.target.value })} placeholder="2025" />
            </label>
            <label>
              Grade / Result / Level
              <input value={draft.grade} onChange={(event) => patch({ grade: event.target.value })} />
            </label>
          </div>
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
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Qualification'}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <div className="notice danger">{error}</div> : null}
      {message ? <div className="notice success">{message}</div> : null}

      {loading ? (
        <div className="tashjee-empty compact-empty">Loading qualifications...</div>
      ) : qualifications.length ? (
        <div className="qualification-list">
          {qualifications.map((qualification) => (
            <article className="qualification-card" key={qualification.id}>
              <div>
                <p>{qualification.title}</p>
                <h3>{qualification.institute || 'Institute not provided'}</h3>
                <span>
                  {[qualification.yearObtained, qualification.grade].filter(Boolean).join(' · ') || 'Result details not provided'}
                </span>
                {qualification.notes ? <strong>{qualification.notes}</strong> : null}
              </div>
              <div className="qualification-actions">
                <button className="icon-button" type="button" onClick={() => startEdit(qualification)} aria-label={`Edit ${qualification.title}`}>
                  <Edit3 size={15} />
                </button>
                <button
                  className="icon-button request-delete-button"
                  type="button"
                  onClick={() => void remove(qualification)}
                  disabled={deletingId === qualification.id}
                  aria-label={`Remove ${qualification.title}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="tashjee-empty compact-empty">No qualifications saved yet.</div>
      )}

      {hasLegacyQualifications && !qualifications.length ? (
        <div className="legacy-qualifications">
          <span>Legacy Registration Qualifications</span>
          <p>{[...legacyQualifications, legacyOtherQual].filter(Boolean).join(', ')}</p>
        </div>
      ) : null}
    </section>
  );
}
