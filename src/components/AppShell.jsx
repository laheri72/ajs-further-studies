import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Footer } from './Footer';

export function AppShell({ children, title = 'Further Studies Portal' }) {
  const { user, profile, signOutUser } = useAuth();

  return (
    <div className="page-shell">
      <nav className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">FS</span>
          <span>{title}</span>
        </Link>
        {user ? (
          <div className="nav-user">
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
