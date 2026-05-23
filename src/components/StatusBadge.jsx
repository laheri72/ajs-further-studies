export function StatusBadge({ status }) {
  const approved = status === 'approved';
  const pending = status === 'pending';
  const onHold = status === 'on-hold';
  return (
    <span className={`status-badge ${approved ? 'approved' : onHold ? 'on-hold' : pending ? 'pending' : 'neutral'}`}>
      {approved ? 'Approved' : onHold ? 'On Hold' : pending ? 'Pending' : 'Not Submitted'}
    </span>
  );
}
