export function StatusBadge({ status }) {
  const approved = status === 'approved';
  const pending = status === 'pending';
  return (
    <span className={`status-badge ${approved ? 'approved' : pending ? 'pending' : 'neutral'}`}>
      {approved ? 'Approved' : pending ? 'Pending' : 'Not Submitted'}
    </span>
  );
}
