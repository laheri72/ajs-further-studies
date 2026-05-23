import { ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function UnauthorizedPage() {
  const { signOutUser, user } = useAuth();

  return (
    <main className="auth-layout">
      <section className="auth-card fade-up">
        <div className="auth-badge danger-icon">
          <ShieldX size={28} />
        </div>
        <h1>Access Denied</h1>
        <p>
          {user?.email || 'This account'} is not authorised to access the Admin Portal.
          Please contact the Idara if this access should be enabled.
        </p>
        <button className="outline-button full" type="button" onClick={signOutUser}>
          Sign out and try a different account
        </button>
        <Link className="subtle-link" to="/">
          Back to Home
        </Link>
      </section>
    </main>
  );
}
