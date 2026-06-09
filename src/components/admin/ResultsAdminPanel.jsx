import { AlertCircle, CheckCircle2, Search, ShieldCheck, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { subscribeAllResults, updateResultStatus } from '../../services/firestore';

export function ResultsAdminPanel() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeAllResults(
      (data) => {
        setResults(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Unable to load results.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const pendingResults = useMemo(() => results.filter((r) => !r.status || r.status === 'pending'), [results]);
  const approvedResults = useMemo(() => results.filter((r) => r.status === 'approved'), [results]);
  const rejectedResults = useMemo(() => results.filter((r) => r.status === 'rejected'), [results]);

  const filteredPending = useMemo(() => filterResults(pendingResults, search), [pendingResults, search]);
  const filteredApproved = useMemo(() => filterResults(approvedResults, search), [approvedResults, search]);
  const filteredRejected = useMemo(() => filterResults(rejectedResults, search), [rejectedResults, search]);

  const activeResults = activeTab === 'pending' ? filteredPending : activeTab === 'approved' ? filteredApproved : filteredRejected;

  return (
    <section className="panel tashjee-panel tashjee-admin-panel">
      <div className="section-heading tashjee-section-heading">
        <p className="eyebrow">Academic Records</p>
        <h2>Results Management</h2>
        <p>Review student academic results, inspect proof of success, and issue formal approval.</p>
      </div>

      <div className="tashjee-admin-meta" style={{marginBottom: '2rem'}}>
        <div className="stat-card gold">
          <span>Total Submitted</span>
          <strong>{results.length}</strong>
        </div>
        <div className="stat-card warning">
          <span>Pending Review</span>
          <strong>{pendingResults.length}</strong>
        </div>
        <div className="stat-card success">
          <span>Approved</span>
          <strong>{approvedResults.length}</strong>
        </div>
      </div>

      <div className="tashjee-toolbar">
        <label className="search-box tashjee-search-box">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by TR, name, degree..." />
        </label>
      </div>

      <div className="dashboard-tabs admin-tabs tashjee-tabs">
        <button className={activeTab === 'pending' ? 'active' : ''} type="button" onClick={() => setActiveTab('pending')}>
          <AlertCircle size={16} />
          Pending ({pendingResults.length})
        </button>
        <button className={activeTab === 'approved' ? 'active' : ''} type="button" onClick={() => setActiveTab('approved')}>
          <CheckCircle2 size={16} />
          Approved ({approvedResults.length})
        </button>
        <button className={activeTab === 'rejected' ? 'active' : ''} type="button" onClick={() => setActiveTab('rejected')}>
          <X size={16} />
          Rejected ({rejectedResults.length})
        </button>
      </div>

      {error ? <div className="notice danger">{error}</div> : null}

      <div className="tashjee-table-shell">
        {loading ? (
          <div className="tashjee-empty">Loading results...</div>
        ) : activeResults.length ? (
          <div className="table-wrap tashjee-table-wrap">
            <table className="tashjee-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Qualification</th>
                  <th>Result</th>
                  <th>Proof</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeResults.map((result) => (
                  <tr key={result.id}>
                    <td>
                      <strong>{result.studentName || 'Unknown Student'}</strong>
                      <span className="table-subtext">{result.trNo}</span>
                    </td>
                    <td>
                      <strong>{result.title}</strong>
                      <span className="table-subtext">{result.institute || '-'}</span>
                    </td>
                    <td>
                      <strong>{result.percentage ? `${result.percentage}%` : result.grade || '-'}</strong>
                    </td>
                    <td>
                      {result.proofUrl ? (
                         <a href={result.proofUrl} target="_blank" rel="noreferrer" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                            <ImageIcon size={14} /> View
                         </a>
                      ) : <span className="muted-cell">None</span>}
                    </td>
                    <td>
                      {result.createdAt?.seconds ? new Date(result.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <button className="outline-button small" type="button" onClick={() => setSelectedResult(result)}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tashjee-empty">
            No results match this filter.
          </div>
        )}
      </div>

      {selectedResult ? (
        <ResultReviewModal
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      ) : null}
    </section>
  );
}

function ResultReviewModal({ result, onClose }) {
  const [status, setStatus] = useState(result.status || 'pending');
  const [adminNotes, setAdminNotes] = useState(result.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true);
    setError('');
    try {
      await updateResultStatus(result.studentId, result.id, status, adminNotes);
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to update result.');
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal tashjee-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Review Result</p>
            <h2 id="review-title">{result.studentName || 'Student Result'}</h2>
            <p>{result.trNo} · {result.studentEmail}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close review">
            <X size={18} />
          </button>
        </header>

        <div className="detail-grid tashjee-detail-grid">
          <div className="detail-cell">
            <span>Qualification</span>
            <strong>{result.title}</strong>
          </div>
          <div className="detail-cell">
            <span>Institute</span>
            <strong>{result.institute || '-'}</strong>
          </div>
          <div className="detail-cell">
            <span>Year Obtained</span>
            <strong>{result.yearObtained || '-'}</strong>
          </div>
          <div className="detail-cell">
            <span>Grade / Level</span>
            <strong>{result.grade || '-'}</strong>
          </div>
          <div className="detail-cell">
            <span>Percentage</span>
            <strong>{result.percentage ? `${result.percentage}%` : '-'}</strong>
          </div>
          <div className="detail-cell">
            <span>Student Notes</span>
            <strong>{result.notes || '-'}</strong>
          </div>
        </div>

        <div className="detail-stack">
          <div className="detail-cell">
            <span>Proof of Success</span>
            {result.proofUrl ? (
              <div className="proof-preview-wrap">
                <img className="proof-preview" src={result.proofPreviewUrl || result.proofUrl} alt="Result proof preview" />
                <a href={result.proofPreviewUrl || result.proofUrl} target="_blank" rel="noreferrer">
                  Open full image
                </a>
              </div>
            ) : (
              <strong>No proof image uploaded.</strong>
            )}
          </div>
        </div>

        <div className="split-choice modal-choice">
          {['pending', 'rejected', 'approved'].map((nextStatus) => (
            <button
              className={`choice-card ${status === nextStatus ? 'selected' : ''}`}
              type="button"
              onClick={() => setStatus(nextStatus)}
              key={nextStatus}
            >
              {nextStatus === 'approved' ? <ShieldCheck size={16} /> : nextStatus === 'rejected' ? <X size={16} /> : <AlertCircle size={16} />}
              {nextStatus === 'approved' ? 'Approved' : nextStatus === 'rejected' ? 'Rejected' : 'Pending'}
            </button>
          ))}
        </div>

        <label>
          Admin Notes (Visible to Student)
          <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} />
        </label>

        {error ? <div className="notice danger">{error}</div> : null}

        <div className="form-actions">
          <button className="outline-button" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="gold-button" type="button" onClick={save} disabled={saving}>
            {saving ? <Loader2 size={16} className="spin-icon" /> : <ShieldCheck size={16} />}
            {saving ? 'Saving...' : 'Save Decision'}
          </button>
        </div>
      </section>
    </div>
  );
}

function filterResults(results, search) {
  const q = String(search || '').trim().toLowerCase();
  if (!q) return results;

  return results.filter((r) => {
    const haystack = [
      r.studentName,
      r.trNo,
      r.title,
      r.institute,
      r.yearObtained,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}