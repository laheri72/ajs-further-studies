import { Bell, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribePendingTashjeeCount } from '../services/tashjee';
import { Footer } from './Footer';

export function AppShell({ children, title = 'Further Studies Portal' }) {
  const { user, profile, signOutUser, isAdmin, hasFirebaseConfig } = useAuth();
  const [pendingTashjeeCount, setPendingTashjeeCount] = useState(0);

  useEffect(() => {
    if (!isAdmin || !hasFirebaseConfig) return undefined;

    return subscribePendingTashjeeCount(
      (count) => setPendingTashjeeCount(count),
      () => setPendingTashjeeCount(0),
    );
  }, [isAdmin, hasFirebaseConfig]);

  return (
    <div className="page-shell">
      <nav className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">FS</span>
          <span>{title}</span>
        </Link>
        {user ? (
          <div className="nav-user">
            {isAdmin ? (
              <Link className="topbar-bell" to="/admin?tab=tashjee" aria-label="Open Tashjee Management">
                <Bell size={17} />
                {pendingTashjeeCount ? <span className="topbar-badge">{pendingTashjeeCount}</span> : null}
                <span className="topbar-bell-label">Requests</span>
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
