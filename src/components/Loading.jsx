export function Loading({ label = 'Loading portal' }) {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}
