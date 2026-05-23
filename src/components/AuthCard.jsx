import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { STUDENT_EMAIL_DOMAIN } from '../utils/registration';
import { Footer } from './Footer';
import { GoogleIcon } from './GoogleIcon';

export function AuthCard({ role }) {
  const { error, hasFirebaseConfig, signInWithGoogle } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <div className="auth-page">
      <main className="auth-layout">
        <section className="auth-card fade-up">
          <div className="auth-badge">{isAdmin ? <ShieldCheck size={26} /> : 'FS'}</div>
          <p className="eyebrow">{isAdmin ? 'Idara Access' : 'Student Access'}</p>
          <h1>{isAdmin ? 'Admin Portal' : 'Further Studies Portal'}</h1>
          <p>
            {isAdmin
              ? 'Authorised Idara personnel may sign in to review student records and manage raza status.'
              : 'Sign in with your official Jamea EDU  account to register further-studies details and view your raza status.'}
          </p>
          <button
            className="google-button"
            type="button"
            onClick={() =>
              signInWithGoogle({
                hostedDomain: isAdmin ? undefined : STUDENT_EMAIL_DOMAIN.slice(1),
              })
            }
          >
            <GoogleIcon />
            Continue with Google
          </button>
          {!hasFirebaseConfig ? (
            <div className="notice danger">Firebase is not configured yet. Add values to `.env` first.</div>
          ) : null}
          {error ? <div className="notice danger">{error}</div> : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}
