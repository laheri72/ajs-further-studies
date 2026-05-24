import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { createTashjeeRequest, deleteTashjeeRequest, subscribeStudentTashjeeRequests, subscribeTashjeeConfig, uploadTashjeeProof } from '../services/tashjee';
import { describeTashjeeProofRules, formatTashjeeTimestamp, isTashjeeProofFile, isTashjeeRequestDeletable, TASHJEE_DEFAULT_OPTIONS, TASHJEE_PROOF_ACCEPT } from '../utils/tashjee';

export function TashjeeStudentTab({ user, profile }) {
  const fileInputRef = useRef(null);
  const [options, setOptions] = useState(TASHJEE_DEFAULT_OPTIONS);
  const [requests, setRequests] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [submittingPhase, setSubmittingPhase] = useState('idle');
  const [deletingRequestId, setDeletingRequestId] = useState('');
  const [values, setValues] = useState({ requestType: '', detailedReason: '' });
  const [proofFile, setProofFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribeConfig = subscribeTashjeeConfig(
      (snapshot) => {
        setOptions(snapshot.options.length ? snapshot.options : TASHJEE_DEFAULT_OPTIONS);
        setLoadingConfig(false);
      },
      (err) => {
        setError(err.message || 'Unable to load Tashjee options.');
        setLoadingConfig(false);
      },
    );

    const unsubscribeRequests = subscribeStudentTashjeeRequests(
      user.uid,
      (items) => {
        setRequests(items);
        setLoadingRequests(false);
      },
      (err) => {
        setError(err.message || 'Unable to load Tashjee requests.');
        setLoadingRequests(false);
      },
    );

    return () => {
      unsubscribeConfig();
      unsubscribeRequests();
    };
  }, [user.uid]);

  const isLoading = loadingConfig || loadingRequests;
  const sortedRequests = useMemo(() => requests, [requests]);

  function patch(nextValue) {
    setValues((current) => ({ ...current, ...nextValue }));
    setError('');
    setMessage('');
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) {
      setProofFile(null);
      return;
    }

    if (!isTashjeeProofFile(selectedFile)) {
      setError('Upload a JPG, JPEG, or PNG image smaller than 2 MB.');
      event.target.value = '';
      setProofFile(null);
      return;
    }

    setProofFile(selectedFile);
    setError('');
    setMessage('');
  }

  async function submit(event) {
    event.preventDefault();

    if (!values.requestType) {
      setError('Please select a request type.');
      return;
    }

    if (!values.detailedReason.trim()) {
      setError('Please provide a detailed reason.');
      return;
    }

    if (!proofFile) {
      setError('Please attach a proof image.');
      return;
    }

    setError('');
    setMessage('');

    try {
      setSubmittingPhase('uploading');
      const uploadedProof = await uploadTashjeeProof(proofFile);
      setSubmittingPhase('saving');
      await createTashjeeRequest(user, profile, values, uploadedProof);
      setValues({ requestType: '', detailedReason: '' });
      setProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setMessage('Your Tashjee request has been submitted for review.');
    } catch (err) {
      setError(err.message || 'Unable to submit your Tashjee request.');
    } finally {
      setSubmittingPhase('idle');
    }
  }

  async function handleDeleteRequest(request) {
    if (!isTashjeeRequestDeletable(request.status)) {
      setError('Only pending or on-hold requests can be deleted.');
      return;
    }

    const confirmed = window.confirm('Delete this request? This cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingRequestId(request.id);
      setError('');
      setMessage('');
      await deleteTashjeeRequest(request);
      setMessage('Request deleted.');
    } catch (err) {
      setError(err.message || 'Unable to delete this request.');
    } finally {
      setDeletingRequestId('');
    }
  }

  return (
    <section className="panel tashjee-panel">
      <div className="section-heading">
        <p className="eyebrow">Module V2</p>
        <h2>Tashjee Request</h2>
        <p>Submit verified academic achievements for Idara review and track each request in real time.</p>
      </div>

      <div className="tashjee-layout">
        <form className="tashjee-form" onSubmit={submit}>
          <div className="tashjee-form-head">
            <div>
              <span>New Request</span>
              <strong>Upload proofs and ask for merit verification.</strong>
            </div>
            <FileText size={18} />
          </div>

          <label>
            Request Type
            <select value={values.requestType} onChange={(event) => patch({ requestType: event.target.value })}>
              <option value="">Select an option</option>
              {options.map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Detailed Reason
            <textarea
              value={values.detailedReason}
              onChange={(event) => patch({ detailedReason: event.target.value })}
              placeholder="Explain the achievement, exam result, or merit case in detail."
            />
          </label>

          <label>
            Proof Image
            <input
              ref={fileInputRef}
              type="file"
              accept={TASHJEE_PROOF_ACCEPT}
              onChange={handleFileChange}
            />
            <span className="field-hint">{describeTashjeeProofRules()}</span>
          </label>

          {proofFile ? (
            <div className="file-chip">
              <Upload size={15} />
              <span>{proofFile.name}</span>
            </div>
          ) : null}

          {submittingPhase === 'uploading' ? (
            <div className="notice warning uploading-state">
              <Loader2 size={16} className="spin-icon" />
              Uploading proof image...
            </div>
          ) : null}

          {submittingPhase === 'saving' ? (
            <div className="notice warning uploading-state">
              <Loader2 size={16} className="spin-icon" />
              Saving request to Firestore...
            </div>
          ) : null}

          {error ? <div className="notice danger">{error}</div> : null}
          {message ? <div className="notice success">{message}</div> : null}

          <button className="gold-button full" type="submit" disabled={submittingPhase !== 'idle'}>
            {submittingPhase === 'uploading' ? 'Uploading...' : submittingPhase === 'saving' ? 'Saving...' : 'Submit Request'}
          </button>
        </form>

        <div className="tashjee-feed">
          <div className="tashjee-feed-head">
            <div>
              <span>Your Requests</span>
              <strong>Track pending, approved, and rejected submissions in real time.</strong>
            </div>
            <Clock3 size={18} />
          </div>
          <p className="tashjee-feed-note">Deleting a request clears your request history. When Cloudinary returns a delete token, the uploaded proof is removed too.</p>

          {isLoading ? (
            <div className="tashjee-empty">
              <Loader2 size={18} className="spin-icon" />
              Loading your Tashjee requests...
            </div>
          ) : sortedRequests.length ? (
            <div className="tashjee-list">
              {sortedRequests.map((request) => (
                <article className={`tashjee-request-card ${request.status}`} key={request.id}>
                  <div className="tashjee-request-head">
                    <div>
                      <p>{request.requestType}</p>
                      <h3>{formatTashjeeTimestamp(request.createdAt) || 'Just submitted'}</h3>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="tashjee-reason">{request.detailedReason}</p>
                  <div className="tashjee-request-footer">
                    <span className="muted">Request ID: {request.requestId}</span>
                    <div className="tashjee-request-actions">
                      <a href={request.proofPreviewUrl || request.proofUrl} target="_blank" rel="noreferrer">
                        Open preview
                      </a>
                      <button
                        type="button"
                        className="icon-button tiny request-delete-button"
                        onClick={() => void handleDeleteRequest(request)}
                        disabled={deletingRequestId === request.id || !isTashjeeRequestDeletable(request.status)}
                        aria-label={`Delete ${request.requestType} request`}
                        title={isTashjeeRequestDeletable(request.status) ? 'Delete request' : 'Only pending or on-hold requests can be deleted'}
                      >
                        {deletingRequestId === request.id ? <Loader2 size={13} className="spin-icon" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                  {request.adminRemarks ? (
                    <div className="admin-note compact-note">
                      <span>Admin remarks</span>
                      <p>{request.adminRemarks}</p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="tashjee-empty">You have not submitted any Tashjee requests yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}
