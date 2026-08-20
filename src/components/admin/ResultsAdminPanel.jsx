import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { subscribeAllResults, updateResultStatus } from '../../services/firestore';
import { exportToExcel, exportToPDF } from '../../utils/exportData';

export function ResultsAdminPanel() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
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
      },
    );
    return () => unsubscribe();
  }, []);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const pendingResults = useMemo(() => results.filter((r) => !r.status || r.status === 'pending'), [results]);
  const approvedResults = useMemo(() => results.filter((r) => r.status === 'approved'), [results]);
  const rejectedResults = useMemo(() => results.filter((r) => r.status === 'rejected'), [results]);

  const filteredPending = useMemo(() => filterResults(pendingResults, search), [pendingResults, search]);
  const filteredApproved = useMemo(() => filterResults(approvedResults, search), [approvedResults, search]);
  const filteredRejected = useMemo(() => filterResults(rejectedResults, search), [rejectedResults, search]);

  const activeFilteredResults =
    activeTab === 'pending' ? filteredPending : activeTab === 'approved' ? filteredApproved : filteredRejected;

  const sortedResults = useMemo(() => {
    return [...activeFilteredResults].sort((left, right) => {
      let valA = left[sortKey];
      let valB = right[sortKey];

      if (sortKey === 'createdAt') {
        valA = left.createdAt?.seconds || 0;
        valB = right.createdAt?.seconds || 0;
      } else if (sortKey === 'percentage') {
        valA = Number(left.percentage || 0);
        valB = Number(right.percentage || 0);
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [activeFilteredResults, sortKey, sortDir]);

  function exportResultsExcel() {
    const columns = [
      { key: 'trNo', label: 'TR Number' },
      { key: 'studentName', label: 'Student Name' },
      { key: 'studentEmail', label: 'Student Email' },
      { key: 'title', label: 'Qualification Title' },
      { key: 'institute', label: 'Institute / Board' },
      { key: 'yearObtained', label: 'Year Obtained' },
      { key: 'grade', label: 'Grade / Level' },
      { key: 'percentage', label: 'Percentage' },
      { key: 'proofUrl', label: 'Proof URL' },
      { key: 'status', label: 'Status' },
      { key: 'notes', label: 'Student Notes' },
      { key: 'adminNotes', label: 'Admin Notes' },
      { key: 'submittedAtDate', label: 'Submission Date' },
    ];

    const exportRows = sortedResults.map((r) => ({
      ...r,
      status: r.status || 'pending',
      percentage: r.percentage ? `${r.percentage}%` : '-',
      submittedAtDate: r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : '-',
    }));

    exportToExcel(`External_Examinations_Results_${activeTab}`, 'Academic Results', columns, exportRows);
  }

  function exportResultsPDF() {
    const columns = [
      { key: 'trNo', label: 'TR' },
      { key: 'studentName', label: 'Student Name' },
      { key: 'title', label: 'Qualification' },
      { key: 'institute', label: 'Institute' },
      { key: 'result', label: 'Result' },
      { key: 'status', label: 'Status' },
      { key: 'submittedAtDate', label: 'Submitted' },
    ];

    const exportRows = sortedResults.map((r) => ({
      ...r,
      result: r.percentage ? `${r.percentage}%` : r.grade || '-',
      status: r.status || 'pending',
      submittedAtDate: r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : '-',
    }));

    exportToPDF(`External_Examinations_Results_${activeTab}`, `Academic Results Audit Report (${activeTab.toUpperCase()})`, columns, exportRows);
  }

  return (
    <section className="panel tashjee-panel tashjee-admin-panel">
      <div className="tashjee-header-block">
        <div className="section-heading tashjee-section-heading">
          <p className="eyebrow">Academic Records</p>
          <h2>Results & Qualifications Management</h2>
          <p>Review student academic results, inspect proof of success certificates, and govern formal approvals.</p>
        </div>

        <div className="tashjee-sleek-stats">
          <div className="sleek-stat-card gold">
            <div className="sleek-stat-icon">
              <FileText size={18} />
            </div>
            <div className="sleek-stat-content">
              <span className="sleek-stat-label">Total Submitted</span>
              <strong className="sleek-stat-value">{results.length}</strong>
            </div>
          </div>
          <div className="sleek-stat-card warning">
            <div className="sleek-stat-icon">
              <Clock size={18} />
            </div>
            <div className="sleek-stat-content">
              <span className="sleek-stat-label">Pending Review</span>
              <strong className="sleek-stat-value">{pendingResults.length}</strong>
            </div>
          </div>
          <div className="sleek-stat-card success">
            <div className="sleek-stat-icon">
              <CheckCircle2 size={18} />
            </div>
            <div className="sleek-stat-content">
              <span className="sleek-stat-label">Approved</span>
              <strong className="sleek-stat-value">{approvedResults.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="tashjee-toolbar" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="search-box tashjee-search-box" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by TR, student name, qualification, institute..."
          />
        </label>
        <div className="admin-tools-actions">
          <button className="gold-button small" type="button" onClick={exportResultsExcel} title="Export results to MS Excel (.xlsx)">
            <FileSpreadsheet size={15} />
            Export Excel (.xlsx)
          </button>
          <button className="outline-button small" type="button" onClick={exportResultsPDF} title="Export results to PDF report (.pdf)">
            <FileText size={15} />
            Export PDF (.pdf)
          </button>
        </div>
      </div>

      <div className="dashboard-tabs admin-tabs tashjee-tabs">
        <button
          className={activeTab === 'pending' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('pending')}
        >
          <AlertCircle size={16} />
          Pending ({pendingResults.length})
        </button>
        <button
          className={activeTab === 'approved' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('approved')}
        >
          <CheckCircle2 size={16} />
          Approved ({approvedResults.length})
        </button>
        <button
          className={activeTab === 'rejected' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('rejected')}
        >
          <X size={16} />
          Rejected ({rejectedResults.length})
        </button>
      </div>

      {error ? <div className="notice danger">{error}</div> : null}

      <div className="tashjee-table-shell">
        {loading ? (
          <div className="tashjee-empty">Loading results...</div>
        ) : sortedResults.length ? (
          <div className="table-wrap tashjee-table-wrap">
            <table className="tashjee-table">
              <thead>
                <tr>
                  <SortableTh label="Student" columnKey="studentName" currentSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableTh label="Qualification" columnKey="title" currentSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableTh label="Result" columnKey="percentage" currentSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th>Proof Certificate</th>
                  <SortableTh label="Submitted" columnKey="createdAt" currentSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((result) => (
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
                        <a
                          href={result.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <ImageIcon size={14} /> View Image
                        </a>
                      ) : (
                        <span className="muted-cell">None</span>
                      )}
                    </td>
                    <td>
                      {result.createdAt?.seconds
                        ? new Date(result.createdAt.seconds * 1000).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      <button
                        className="outline-button small"
                        type="button"
                        onClick={() => setSelectedResult(result)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tashjee-empty">No results match this filter.</div>
        )}
      </div>

      {selectedResult ? (
        <ResultReviewModal result={selectedResult} onClose={() => setSelectedResult(null)} />
      ) : null}
    </section>
  );
}

function SortableTh({ label, columnKey, currentSortKey, sortDir, onSort }) {
  const isSorted = currentSortKey === columnKey;
  return (
    <th className="sortable-th" onClick={() => onSort(columnKey)}>
      <button className="sort-th-button" type="button">
        <span>{label}</span>
        {isSorted ? (
          sortDir === 'asc' ? <ArrowUp size={14} className="sort-icon active" /> : <ArrowDown size={14} className="sort-icon active" />
        ) : (
          <ArrowUpDown size={13} className="sort-icon muted" />
        )}
      </button>
    </th>
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
            <p className="eyebrow">Review Result Decision</p>
            <h2 id="review-title">{result.studentName || 'Student Result'}</h2>
            <p>
              {result.trNo} · {result.studentEmail}
            </p>
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
            <span>Proof Certificate</span>
            {result.proofUrl ? (
              <div className="proof-preview-wrap">
                <a
                  href={result.proofPreviewUrl || result.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="proof-preview-link"
                  title="Click to open full resolution certificate image"
                >
                  <img
                    className="proof-preview"
                    src={result.proofPreviewUrl || result.proofUrl}
                    alt="Result proof preview"
                  />
                </a>
                <a
                  href={result.proofPreviewUrl || result.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="proof-preview-action"
                >
                  <span>Inspect Full Resolution Certificate</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            ) : (
              <strong>No proof image uploaded.</strong>
            )}
          </div>
        </div>

        <div className="cta-decision-group">
          <button
            className={`cta-decision cta-pending ${status === 'pending' ? 'selected' : ''}`}
            type="button"
            onClick={() => setStatus('pending')}
          >
            <Clock size={17} />
            <span>Pending</span>
          </button>
          <button
            className={`cta-decision cta-rejected ${status === 'rejected' ? 'selected' : ''}`}
            type="button"
            onClick={() => setStatus('rejected')}
          >
            <XCircle size={17} />
            <span>Rejected</span>
          </button>
          <button
            className={`cta-decision cta-approved ${status === 'approved' ? 'selected' : ''}`}
            type="button"
            onClick={() => setStatus('approved')}
          >
            <CheckCircle2 size={17} />
            <span>Approved</span>
          </button>
        </div>

        <label>
          Admin Notes (Visible to Student)
          <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} placeholder="Add feedback or guidance for student..." />
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
    const haystack = [r.studentName, r.trNo, r.title, r.institute, r.yearObtained]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}