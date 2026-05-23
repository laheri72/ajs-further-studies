export function StatusBadge({ status }) {
  const approved = status === 'approved';
  return <span className={`status-badge ${approved ? 'approved' : 'pending'}`}>{approved ? 'Approved' : 'Pending'}</span>;
}
