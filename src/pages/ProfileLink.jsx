import { CheckCircle2, Mail, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { linkStudentProfile } from '../services/firestore';
import { isValidStudentEmail, nameFromGoogleUser, trFromStudentEmail } from '../utils/registration';

export function ProfileLink({ onLinked }) {
  const { user, refreshProfile, signOutUser } = useAuth();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const validStudent = isValidStudentEmail(user?.email);
  const trNo = trFromStudentEmail(user?.email);
  const fullName = nameFromGoogleUser(user);

  async function confirmIdentity() {
    setSaving(true);
    setError('');
    try {
      await linkStudentProfile(user);
      await refreshProfile();
      onLinked();
    } catch (err) {
      setError(err.message || 'Unable to confirm this student account.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <main className="center-layout">
        <section className="panel narrow fade-up identity-card">
          <p className="eyebrow">Student Identity</p>
          <h1>Confirm Your Account</h1>
          <p className="muted">
            Student access is limited to official Jamea Saifiyah EDU accounts.
          </p>

          {validStudent ? (
            <>
              <div className="identity-summary">
                <div>
                  <span>TR Number</span>
                  <strong>{trNo}</strong>
                </div>
                <div>
                  <span>Google Email</span>
                  <strong>{user.email}</strong>
                </div>
                <div>
                  <span>Name</span>
                  <strong>{fullName}</strong>
                </div>
              </div>
              <div className="notice success">
                <CheckCircle2 size={16} />
                This account matches the university workspace format.
              </div>
              {error ? <div className="notice danger">{error}</div> : null}
              <button className="gold-button full" type="button" onClick={confirmIdentity} disabled={saving}>
                {saving ? 'Confirming...' : 'Confirm and Continue'}
              </button>
            </>
          ) : (
            <>
              <div className="notice danger">
                <ShieldAlert size={16} />
                Please sign in with your official account, for example 25687@jameasaifiyah.edu.
              </div>
              <div className="identity-summary">
                <div>
                  <span>Current account</span>
                  <strong>{user.email}</strong>
                </div>
              </div>
              <button className="outline-button full" type="button" onClick={signOutUser}>
                <Mail size={16} />
                Sign in with another Google account
              </button>
            </>
          )}
        </section>
      </main>
    </AppShell>
  );
}
