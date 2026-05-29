import { ShieldX } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export function UnauthorizedPage() {
  const { refreshAccount, signOutUser, user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [notice, setNotice] = useState('');

  async function checkAgain() {
    setChecking(true);
    setNotice('');
    try {
      const result = await refreshAccount(user);
      if (result.isAdmin) navigate('/admin', { replace: true });
      else setNotice(`${user?.email || 'This account'} still does not have active admin access.`);
    } catch (err) {
      setNotice(err.message || 'Unable to check admin access right now.');
    } finally {
      setChecking(false);
    }
  }

  async function signOutAndReturnToAdminLogin() {
    setSigningOut(true);
    setNotice('');
    try {
      await signOutUser();
      navigate('/admin', { replace: true });
    } catch (err) {
      setNotice(err.message || 'Unable to sign out right now.');
      setSigningOut(false);
    }
  }

  return (
    <div className="auth-page">
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
          <button className="gold-button full" type="button" onClick={checkAgain} disabled={checking || !user}>
            {checking ? 'Checking access...' : 'Check access again'}
          </button>
          <button className="outline-button full" type="button" onClick={signOutAndReturnToAdminLogin} disabled={signingOut}>
            {signingOut ? 'Signing out...' : 'Sign out and try a different account'}
          </button>
          {notice ? <div className="notice danger">{notice}</div> : null}
          <Link className="subtle-link" to="/student">
            Return to Student Portal
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
