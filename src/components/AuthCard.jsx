import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon } from './GoogleIcon';

export function AuthCard({ role }) {
  const { error, hasFirebaseConfig, signInWithGoogle } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <main className="auth-layout">
      <section className="auth-card fade-up">
        <div className="auth-badge">{isAdmin ? <ShieldCheck size={26} /> : 'FS'}</div>
        <p className="eyebrow">{isAdmin ? 'Idara Access' : 'Student Access'}</p>
        <h1>{isAdmin ? 'Admin Portal' : 'Student Portal'}</h1>
        <p>
          {isAdmin
            ? 'Authorised Idara personnel may sign in to review student records and manage raza status.'
            : 'Sign in with your Google account to register further-studies details and view your raza status.'}
        </p>
        <button className="google-button" type="button" onClick={signInWithGoogle}>
          <GoogleIcon />
          Continue with Google
        </button>
        {!hasFirebaseConfig ? (
          <div className="notice danger">Firebase is not configured yet. Add values to `.env` first.</div>
        ) : null}
        {error ? <div className="notice danger">{error}</div> : null}
        <Link className="subtle-link" to="/">
          Back to Home
        </Link>
      </section>
    </main>
  );
}
