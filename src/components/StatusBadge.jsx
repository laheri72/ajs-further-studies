export function StatusBadge({ status }) {
  const approved = status === 'approved';
  const pending = status === 'pending';
  const onHold = status === 'on-hold';
  const rejected = status === 'rejected';
  return (
    <span className={`status-badge ${approved ? 'approved' : rejected ? 'rejected' : onHold ? 'on-hold' : pending ? 'pending' : 'neutral'}`}>
      {approved ? 'Approved' : rejected ? 'Rejected' : onHold ? 'On Hold' : pending ? 'Pending' : 'Not Submitted'}
    </span>
  );
}
