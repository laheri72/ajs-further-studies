import { CheckCircle2, Mail, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { linkStudentProfile } from '../services/firestore';
import { isValidStudentEmail, nameFromGoogleUser, trFromStudentEmail } from '../utils/registration';

export function ProfileLink({ onLinked }) {
  const { user, refreshProfile, signOutUser } = useAuth();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [whitelistEntry, setWhitelistEntry] = useState(null);
  const [checkingWhitelist, setCheckingWhitelist] = useState(!isValidStudentEmail(user?.email));

  const validStudent = isValidStudentEmail(user?.email) || !!whitelistEntry;
  const trNo = whitelistEntry ? whitelistEntry.trNo : trFromStudentEmail(user?.email);
  const fullName = whitelistEntry?.fullName || nameFromGoogleUser(user);

  useEffect(() => {
    if (isValidStudentEmail(user?.email) || !user?.email) {
      setCheckingWhitelist(false);
      return;
    }

    let alive = true;
    async function check() {
      try {
        const snap = await getDoc(doc(db, 'student_whitelist', user.email.toLowerCase()));
        if (alive) setWhitelistEntry(snap.exists() ? snap.data() : null);
      } catch (err) {
        console.error('Whitelist check failed', err);
      } finally {
        if (alive) setCheckingWhitelist(false);
      }
    }
    check();
    return () => { alive = false; };
  }, [user?.email]);

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

  if (checkingWhitelist) {
    return (
      <AppShell>
        <main className="center-layout">
          <section className="panel narrow fade-up identity-card">
            <p className="eyebrow">Student Identity</p>
            <h1>Confirming...</h1>
            <p className="muted">Checking account authorization.</p>
          </section>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="center-layout">
        <section className="panel narrow fade-up identity-card">
          <p className="eyebrow">Student Identity</p>
          <h1>Confirm Your Account</h1>
          <p className="muted">
            {whitelistEntry 
              ? 'Your account has been manually whitelisted by the superadmin.'
              : 'Student access is limited to official Jamea Saifiyah EDU accounts.'}
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
                {whitelistEntry 
                  ? 'Manual authorization found.'
                  : 'This account matches the university workspace format.'}
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
