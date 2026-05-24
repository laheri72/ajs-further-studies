import { Archive, CheckCircle2, ChevronDown, FileText, Loader2, Plus, Search, ShieldAlert, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import {
  ensureTashjeeConfig,
  subscribeApprovedTashjeeRequests,
  subscribePendingTashjeeRequests,
  subscribeTashjeeConfig,
  updateTashjeeConfigOptions,
  updateTashjeeRequestStatus,
} from '../services/tashjee';
import { formatTashjeeTimestamp, normalizeTashjeeOptions, TASHJEE_DEFAULT_OPTIONS } from '../utils/tashjee';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function TashjeeAdminPanel() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [config, setConfig] = useState({ exists: false, options: TASHJEE_DEFAULT_OPTIONS });
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingApproved, setLoadingApproved] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [optionDraft, setOptionDraft] = useState('');
  const [savingOptions, setSavingOptions] = useState(false);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);

  useEffect(() => {
    let alive = true;

    ensureTashjeeConfig().catch(() => {
      if (!alive) return;
    });

    const unsubscribeConfig = subscribeTashjeeConfig(
      (snapshot) => {
        if (!alive) return;
        setConfig(snapshot);
        setLoadingConfig(false);
      },
      (err) => {
        if (!alive) return;
        setError(err.message || 'Unable to load Tashjee options.');
        setLoadingConfig(false);
      },
    );

    const unsubscribePending = subscribePendingTashjeeRequests(
      (items) => {
        if (!alive) return;
        setPendingRequests(items);
        setLoadingPending(false);
      },
      (err) => {
        if (!alive) return;
        setError(err.message || 'Unable to load pending requests.');
        setLoadingPending(false);
      },
    );

    const unsubscribeApproved = subscribeApprovedTashjeeRequests(
      (items) => {
        if (!alive) return;
        setApprovedRequests(items);
        setLoadingApproved(false);
      },
      (err) => {
        if (!alive) return;
        setError(err.message || 'Unable to load approved requests.');
        setLoadingApproved(false);
      },
    );

    return () => {
      alive = false;
      unsubscribeConfig();
      unsubscribePending();
      unsubscribeApproved();
    };
  }, []);

  useEffect(() => {
    setPendingPage((current) => clampPage(current, pendingRequests, search, pageSize, 'pending'));
  }, [pendingRequests, pageSize, search]);

  useEffect(() => {
    setApprovedPage((current) => clampPage(current, approvedRequests, search, pageSize, 'approved'));
  }, [approvedRequests, pageSize, search]);

  const filteredPendingRequests = useMemo(() => filterTashjeeRequests(pendingRequests, search), [pendingRequests, search]);
  const filteredApprovedRequests = useMemo(() => filterTashjeeRequests(approvedRequests, search), [approvedRequests, search]);

  const activeRequests = activeTab === 'pending' ? filteredPendingRequests : filteredApprovedRequests;
  const activePage = activeTab === 'pending' ? pendingPage : approvedPage;
  const activeTotalPages = Math.max(1, Math.ceil(activeRequests.length / pageSize));
  const currentPage = Math.min(activePage, activeTotalPages);
  const visibleRequests = useMemo(
    () => paginateRequests(activeRequests, currentPage, pageSize),
    [activeRequests, currentPage, pageSize],
  );
  const activeLoading = loadingConfig || (activeTab === 'pending' ? loadingPending : loadingApproved);
  const activeRange = getPageRange(activeRequests.length, currentPage, pageSize);

  async function saveDecision(status) {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await updateTashjeeRequestStatus(selected.id, status, remarks);
      setSelected(null);
      setRemarks('');
    } catch (err) {
      setError(err.message || 'Unable to update this request.');
    } finally {
      setSaving(false);
    }
  }

  async function saveOptions(nextOptions) {
    setSavingOptions(true);
    setError('');
    try {
      await updateTashjeeConfigOptions(nextOptions);
      setOptionDraft('');
    } catch (err) {
      setError(err.message || 'Unable to update Tashjee options.');
    } finally {
      setSavingOptions(false);
    }
  }

  function addOption() {
    const nextOptions = normalizeTashjeeOptions([...config.options, optionDraft]);
    if (nextOptions.length === config.options.length) {
      setOptionDraft('');
      return;
    }
    void saveOptions(nextOptions);
  }

  function removeOption(option) {
    void saveOptions(config.options.filter((entry) => entry !== option));
  }

  function handleSearchChange(event) {
    setSearch(event.target.value);
    setPendingPage(1);
    setApprovedPage(1);
  }

  function handlePageSizeChange(event) {
    setPageSize(Number(event.target.value));
    setPendingPage(1);
    setApprovedPage(1);
  }

  const activePlaceholder =
    activeTab === 'pending' ? 'Search pending requests by student, request type, or ID' : 'Search approved archive by student, request type, or ID';

  return (
    <section className="panel tashjee-panel tashjee-admin-panel">
      <div className="section-heading tashjee-section-heading">
        <p className="eyebrow">Tashjee Management</p>
        <h2>Review Merits</h2>
        <p>
            View and manage student Tashjee requests, configure request options, and keep track of the review process all in one place.
        </p>
      </div>

      <div className="tashjee-admin-meta">
        <div className="meta-card">
          <span>Pending Queue</span>
          <strong>{pendingRequests.length}</strong>
        </div>
        <div className="meta-card">
          <span>Approved Archive</span>
          <strong>{approvedRequests.length}</strong>
        </div>
      </div>

      <div className="tashjee-toolbar">
        <label className="search-box tashjee-search-box">
          <Search size={17} />
          <input value={search} onChange={handleSearchChange} placeholder={activePlaceholder} />
        </label>

        <label className="page-size-select">
          Rows per page
          <select value={pageSize} onChange={handlePageSizeChange}>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <details className="option-manager-collapsible">
        <summary className="option-manager-summary">
          <span>
            <SlidersHorizontal size={16} />
            Tashjee Request Options
          </span>
          <ChevronDown size={16} />
        </summary>
        <div className="option-manager-body">
          <div className="option-list">
            {config.options.length ? (
              config.options.map((option) => (
                <div className="option-pill" key={option}>
                  <span>{option}</span>
                  <button type="button" className="icon-button tiny" onClick={() => removeOption(option)} aria-label={`Remove ${option}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="tashjee-empty compact">No request options configured yet.</div>
            )}
          </div>

          <div className="option-manager-form">
            <label>
              Add new option
              <input value={optionDraft} onChange={(event) => setOptionDraft(event.target.value)} placeholder="Type a new request option" />
            </label>

            <div className="option-manager-actions">
              <button className="gold-button" type="button" onClick={addOption} disabled={savingOptions || !optionDraft.trim()}>
                <Plus size={15} />
                {savingOptions ? 'Saving...' : 'Add Option'}
              </button>

              <button className="outline-button" type="button" onClick={() => void saveOptions(TASHJEE_DEFAULT_OPTIONS)} disabled={savingOptions}>
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      </details>

      <div className="dashboard-tabs admin-tabs tashjee-tabs" role="tablist" aria-label="Tashjee request views">
        <button
          type="button"
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => setActiveTab('pending')}
          role="tab"
          aria-selected={activeTab === 'pending'}
        >
          <FileText size={15} />
          Pending
          <span className="tab-count">{pendingRequests.length}</span>
        </button>
        <button
          type="button"
          className={activeTab === 'approved' ? 'active' : ''}
          onClick={() => setActiveTab('approved')}
          role="tab"
          aria-selected={activeTab === 'approved'}
        >
          <Archive size={15} />
          Approved
          <span className="tab-count">{approvedRequests.length}</span>
        </button>
      </div>

      {error ? <div className="notice danger">{error}</div> : null}

      <div className="tashjee-table-shell">
        {activeLoading ? (
          <div className="tashjee-empty">
            <Loader2 size={18} className="spin-icon" />
            Loading {activeTab === 'pending' ? 'pending queue' : 'approved archive'}...
          </div>
        ) : visibleRequests.length ? (
          <div className="table-wrap tashjee-table-wrap">
            <table className="tashjee-table">
              <thead>
                {activeTab === 'pending' ? (
                  <tr>
                    <th>Student</th>
                    <th>Request</th>
                    <th>Summary</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Student</th>
                    <th>Request</th>
                    <th>Approved On</th>
                    <th>Request ID</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {visibleRequests.map((request) =>
                  activeTab === 'pending' ? (
                    <tr key={request.id}>
                      <td>
                        <button type="button" className="table-link-button" onClick={() => openReview(request, setSelected, setRemarks)}>
                          <strong>{getTashjeeStudentLabel(request)}</strong>
                        </button>
                      </td>
                      <td>{request.requestType || '-'}</td>
                      <td className="table-cell-clamp">{truncateText(request.detailedReason || '-', 84)}</td>
                      <td>{formatTashjeeTimestamp(request.createdAt) || 'Just submitted'}</td>
                      <td>
                        <StatusBadge status={request.status} />
                      </td>
                      <td>
                        <button type="button" className="outline-button table-action-button" onClick={() => openReview(request, setSelected, setRemarks)}>
                          Review
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={request.id}>
                      <td>
                        <strong>{getTashjeeStudentLabel(request)}</strong>
                      </td>
                      <td>{request.requestType || '-'}</td>
                      <td>{formatTashjeeTimestamp(request.reviewedAt || request.updatedAt || request.createdAt) || '-'}</td>
                      <td className="table-cell-mono">{request.requestId || request.id}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tashjee-empty">
            {activeTab === 'pending'
              ? 'There are no pending Tashjee requests matching this filter.'
              : 'There are no approved Tashjee requests matching this filter.'}
          </div>
        )}

        <div className="tashjee-pagination">
          <div className="tashjee-pagination-copy">
            <strong>
              {activeRange.start}-{activeRange.end}
            </strong>
            <span>of {activeRequests.length} records</span>
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="outline-button"
              onClick={() => setActivePage(activeTab, 1, setPendingPage, setApprovedPage)}
              disabled={currentPage <= 1 || activeRequests.length === 0}
            >
              First
            </button>
            <button
              type="button"
              className="outline-button"
              onClick={() => setActivePage(activeTab, currentPage - 1, setPendingPage, setApprovedPage)}
              disabled={currentPage <= 1 || activeRequests.length === 0}
            >
              Previous
            </button>
            <span className="pagination-pill">
              Page {currentPage} of {activeTotalPages}
            </span>
            <button
              type="button"
              className="outline-button"
              onClick={() => setActivePage(activeTab, currentPage + 1, setPendingPage, setApprovedPage)}
              disabled={currentPage >= activeTotalPages || activeRequests.length === 0}
            >
              Next
            </button>
            <button
              type="button"
              className="outline-button"
              onClick={() => setActivePage(activeTab, activeTotalPages, setPendingPage, setApprovedPage)}
              disabled={currentPage >= activeTotalPages || activeRequests.length === 0}
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {selected ? (
        <TashjeeRequestModal
          request={selected}
          remarks={remarks}
          onRemarksChange={setRemarks}
          onClose={() => setSelected(null)}
          onDecision={saveDecision}
          saving={saving}
        />
      ) : null}
    </section>
  );
}

function TashjeeRequestModal({ request, remarks, onRemarksChange, onClose, onDecision, saving }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal tashjee-modal" role="dialog" aria-modal="true" aria-labelledby="tashjee-review-title">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Review Request</p>
            <h2 id="tashjee-review-title">{getTashjeeStudentLabel(request)}</h2>
            <p>{request.requestType}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close Tashjee review">
            <X size={18} />
          </button>
        </header>

        <div className="detail-grid tashjee-detail-grid compact">
          <DetailCell label="Submitted" value={formatTashjeeTimestamp(request.createdAt) || '-'} />
          <DetailCell label="Status" value={<StatusBadge status={request.status} />} />
        </div>

        <div className="detail-stack">
          <div className="detail-cell">
            <span>Detailed Reason</span>
            <strong>{request.detailedReason}</strong>
          </div>
          <div className="detail-cell">
            <span>Proof Preview</span>
            <div className="proof-preview-wrap">
              <ProofPreview url={request.proofPreviewUrl || request.proofUrl} />
              <a href={request.proofPreviewUrl || request.proofUrl} target="_blank" rel="noreferrer">
                Open proof image
              </a>
            </div>
          </div>
        </div>

        <label>
          Admin Remarks
          <textarea value={remarks} onChange={(event) => onRemarksChange(event.target.value)} placeholder="Optional note for the student" />
        </label>

        <div className="form-actions modal-actions">
          <div className="modal-danger-actions">
            <button className="danger-button" type="button" onClick={() => onDecision('rejected')} disabled={saving}>
              <ShieldAlert size={15} />
              Reject
            </button>
          </div>
          <div className="modal-save-actions">
            <button className="outline-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="gold-button" type="button" onClick={() => onDecision('approved')} disabled={saving}>
              <CheckCircle2 size={15} />
              Approve
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProofPreview({ url }) {
  if (!url) {
    return <div className="proof-preview proof-preview-empty">No proof preview available.</div>;
  }

  return <img className="proof-preview" src={url} alt="Proof document preview" />;
}

function DetailCell({ label, value }) {
  return (
    <div className="detail-cell">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function filterTashjeeRequests(requests, search) {
  const q = search.trim().toLowerCase();
  if (!q) return requests;
  return requests.filter((request) => {
    const haystack = [request.studentName, request.studentId, request.requestType, request.requestId, request.detailedReason]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

function paginateRequests(requests, page, pageSize) {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return requests.slice(start, start + pageSize);
}

function getPageRange(total, page, pageSize) {
  if (!total) {
    return { start: 0, end: 0 };
  }

  const start = (Math.max(1, page) - 1) * pageSize + 1;
  return {
    start,
    end: Math.min(start + pageSize - 1, total),
  };
}

function clampPage(currentPage, requests, search, pageSize, status) {
  const filtered = filterTashjeeRequests(requests, search);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (currentPage > totalPages) {
    return totalPages;
  }
  if (status === 'pending' || status === 'approved') {
    return currentPage;
  }
  return currentPage;
}

function setActivePage(activeTab, nextPage, setPendingPage, setApprovedPage) {
  const safePage = Math.max(1, nextPage);
  if (activeTab === 'pending') {
    setPendingPage(safePage);
    return;
  }
  setApprovedPage(safePage);
}

function openReview(request, setSelected, setRemarks) {
  setSelected(request);
  setRemarks(request.adminRemarks || '');
}

function getTashjeeStudentLabel(request) {
  const rawName = String(request?.studentName || '').trim();
  const studentId = String(request?.studentId || '').trim();

  if (!rawName) {
    return 'Unknown student';
  }

  if (studentId && rawName.endsWith(studentId)) {
    return rawName.slice(0, -studentId.length).trim();
  }

  const trailingUidMatch = rawName.match(/^(.*?)([A-Za-z0-9]{16,})$/);
  if (trailingUidMatch) {
    const candidate = trailingUidMatch[1].trim();
    if (candidate) {
      return candidate;
    }
  }

  return rawName;
}

function truncateText(value, limit) {
  if (!value) return '-';
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1).trimEnd()}…`;
}
