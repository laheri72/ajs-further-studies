import { LogOut, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeAllResults } from '../services/firestore';
import { Footer } from './Footer';

export function AppShell({ children, title = 'External Examinations Portal' }) {
  const { user, profile, signOutUser, isAdmin } = useAuth();
  const [pendingResultsCount, setPendingResultsCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return undefined;

    const unsubscribe = subscribeAllResults(
      (data) => {
        const count = data.filter((r) => !r.status || r.status === 'pending').length;
        setPendingResultsCount(count);
      },
      () => setPendingResultsCount(0),
    );

    return () => unsubscribe();
  }, [isAdmin]);

  return (
    <div className="page-shell">
      <nav className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">EE</span>
          <span>{title}</span>
        </Link>
        {user ? (
          <div className="nav-user">
            {isAdmin ? (
              <Link className="topbar-bell" to="/admin?tab=results" aria-label="Open Results Management">
                <ShieldCheck size={17} />
                <span className="topbar-bell-label">
                  Results{pendingResultsCount > 0 ? ` (${pendingResultsCount})` : ''}
                </span>
                {pendingResultsCount > 0 ? (
                  <span className="topbar-badge">{pendingResultsCount}</span>
                ) : null}
              </Link>
            ) : null}
            {user.photoURL ? <img src={user.photoURL} alt="" /> : null}
            <span>{profile?.fullName || user.displayName || user.email}</span>
            <button className="danger-button" type="button" onClick={signOutUser}>
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        ) : null}
      </nav>
      {children}
      <Footer />
    </div>
  );
}
