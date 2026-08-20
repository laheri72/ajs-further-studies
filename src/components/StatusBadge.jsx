export function StatusBadge({ status, isAuto = false }) {
  const isAutoApproved = isAuto || status === 'auto-approved';
  const approved = status === 'approved' || status === 'manually-approved';
  const pending = status === 'pending';
  const onHold = status === 'on-hold';
  const rejected = status === 'rejected';

  if (isAutoApproved) {
    return <span className="status-badge auto-approved">Auto-Approved (No Raza)</span>;
  }

  return (
    <span
      className={`status-badge ${approved ? 'approved' : rejected ? 'rejected' : onHold ? 'on-hold' : pending ? 'pending' : 'neutral'}`}
    >
      {approved ? 'Approved (Idara)' : rejected ? 'Rejected' : onHold ? 'On Hold' : pending ? 'Pending' : 'Not Submitted'}
    </span>
  );
}
