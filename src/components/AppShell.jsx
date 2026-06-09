import { LogOut, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Footer } from './Footer';

export function AppShell({ children, title = 'Further Studies Portal' }) {
  const { user, profile, signOutUser, isAdmin } = useAuth();

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
              <Link className="topbar-bell" to="/admin?tab=results" aria-label="Open Results Management">
                <ShieldCheck size={17} />
                <span className="topbar-bell-label">Results</span>
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
