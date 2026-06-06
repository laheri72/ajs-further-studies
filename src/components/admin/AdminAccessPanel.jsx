import { Trash2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  addAdmin,
  addWhitelistedStudent,
  deleteAdmin,
  deleteWhitelistedStudent,
  getAdmins,
  getWhitelistedStudents,
} from '../../services/firestore';
import { MAIN_ADMIN_EMAIL } from '../../data/constants';

export function AdminAccessPanel({ currentUser }) {
  const [admins, setAdmins] = useState([]);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: '', message: '' });

  async function loadAdmins() {
    setLoading(true);
    setNotice({ type: '', message: '' });
    try {
      setAdmins(await getAdmins());
    } catch (err) {
      setNotice({ type: 'danger', message: err.message || 'Unable to load admin access list.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  async function submitAdmin(event) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setNotice({ type: 'danger', message: 'Enter a valid Google account email address.' });
      return;
    }

    setSaving(true);
    setNotice({ type: '', message: '' });
    try {
      await addAdmin(normalizedEmail, currentUser, displayName);
      await loadAdmins();
      setEmail('');
      setDisplayName('');
      setNotice({ type: 'success', message: `${normalizedEmail} can now sign in from the admin portal with Google.` });
    } catch (err) {
      setNotice({ type: 'danger', message: err.message || 'Unable to add admin access.' });
    } finally {
      setSaving(false);
    }
  }

  async function removeAdmin(admin) {
    if (admin.email === MAIN_ADMIN_EMAIL) {
      setNotice({ type: 'danger', message: 'The main admin account cannot be removed from this panel.' });
      return;
    }

    const confirmed = window.confirm(`Remove admin access for ${admin.email}? They will no longer be able to open the admin portal.`);
    if (!confirmed) return;

    setSaving(true);
    setNotice({ type: '', message: '' });
    try {
      await deleteAdmin(admin.email);
      setAdmins((current) => current.filter((item) => item.id !== admin.id));
      setNotice({ type: 'success', message: `${admin.email} admin access was removed.` });
    } catch (err) {
      setNotice({ type: 'danger', message: err.message || 'Unable to remove admin access.' });
    } finally {
      setSaving(false);
    }
  }

  const activeAdmins = admins.filter((admin) => admin.active !== false).length;

  return (
    <section className="admin-access-panel">
      <div className="admin-access-grid">
        <form className="panel admin-access-form" onSubmit={submitAdmin}>
          <div className="section-heading">
            <p className="eyebrow">Google Auth</p>
            <h2>Add Admin</h2>
            <p>Give a trusted Google account access to review records and manage Idara workflows.</p>
          </div>

          <label>
            Admin email
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" />
          </label>

          <label>
            Name or role
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Optional" />
          </label>

          <button className="gold-button" type="submit" disabled={saving}>
            <UserPlus size={16} />
            {saving ? 'Saving...' : 'Add Admin'}
          </button>
        </form>

        <div className="panel admin-access-summary">
          <span>Active Admins</span>
          <strong>{activeAdmins}</strong>
          <p>Access is checked after Google sign-in against the Firestore admin allowlist.</p>
          <button className="outline-button" type="button" onClick={loadAdmins} disabled={loading || saving}>
            Refresh
          </button>
        </div>
      </div>

      {notice.message ? <div className={`notice ${notice.type}`}>{notice.message}</div> : null}

      <section className="table-wrap">
        {loading ? (
          <div className="empty-state">Loading admin access...</div>
        ) : admins.length ? (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name / Role</th>
                <th>Updated By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const isSelf = admin.email === currentUser.email;
                return (
                  <tr key={admin.id}>
                    <td className="gold-text">{admin.email}</td>
                    <td>{admin.displayName || '-'}</td>
                    <td className="muted-cell">{admin.updatedBy || admin.createdBy || '-'}</td>
                    <td>
                      <button className="danger-button small" type="button" onClick={() => removeAdmin(admin)} disabled={saving || isSelf || admin.email === MAIN_ADMIN_EMAIL}>
                        <Trash2 size={14} />
                        Delete Access
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No admin records found.</div>
        )}
      </section>

      <div style={{ marginTop: '4rem', marginBottom: '4rem', borderTop: '1px solid var(--border)' }} />

      <WhitelistedStudentsPanel currentUser={currentUser} />
    </section>
  );
}

function WhitelistedStudentsPanel({ currentUser }) {
  const [students, setStudents] = useState([]);
  const [email, setEmail] = useState('');
  const [trNo, setTrNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: '', message: '' });

  async function loadStudents() {
    setLoading(true);
    setNotice({ type: '', message: '' });
    try {
      setStudents(await getWhitelistedStudents());
    } catch (err) {
      setNotice({ type: 'danger', message: err.message || 'Unable to load whitelisted students.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function submitStudent(event) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setNotice({ type: 'danger', message: 'Enter a valid Google account email address.' });
      return;
    }

    if (!/^[0-9]{5}$/.test(trNo.trim())) {
      setNotice({ type: 'danger', message: 'Enter a valid 5-digit TR number.' });
      return;
    }

    if (!fullName.trim()) {
      setNotice({ type: 'danger', message: 'Enter the student\'s full name.' });
      return;
    }

    setSaving(true);
    setNotice({ type: '', message: '' });
    try {
      await addWhitelistedStudent(normalizedEmail, trNo, fullName, currentUser);
      await loadStudents();
      setEmail('');
      setTrNo('');
      setFullName('');
      setNotice({ type: 'success', message: `${normalizedEmail} is now whitelisted for TR ${trNo}.` });
    } catch (err) {
      setNotice({ type: 'danger', message: err.message || 'Unable to whitelist student.' });
    } finally {
      setSaving(false);
    }
  }

  async function removeStudent(student) {
    const confirmed = window.confirm(`Remove whitelist for ${student.email}? They will no longer be able to use this account for registration.`);
    if (!confirmed) return;

    setSaving(true);
    setNotice({ type: '', message: '' });
    try {
      await deleteWhitelistedStudent(student.email);
      setStudents((current) => current.filter((item) => item.id !== student.id));
      setNotice({ type: 'success', message: `${student.email} was removed from the whitelist.` });
    } catch (err) {
      setNotice({ type: 'danger', message: err.message || 'Unable to remove student from whitelist.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="admin-access-grid">
        <form className="panel admin-access-form" onSubmit={submitStudent}>
          <div className="section-heading">
            <p className="eyebrow">Manual Access</p>
            <h2>Whitelist Student</h2>
            <p>Allow a non-edu Google account to register as a student for a specific TR number.</p>
          </div>

          <label>
            Student email (Google account)
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@gmail.com" autoComplete="email" />
          </label>

          <label>
            TR Number
            <input value={trNo} onChange={(event) => setTrNo(event.target.value)} placeholder="12345" />
          </label>

          <label>
            Full Name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full Name" />
          </label>

          <button className="gold-button" type="submit" disabled={saving}>
            <UserPlus size={16} />
            {saving ? 'Saving...' : 'Whitelist Student'}
          </button>
        </form>

        <div className="panel admin-access-summary">
          <span>Whitelisted Students</span>
          <strong>{students.length}</strong>
          <p>These students can sign in with any Google account and bypass the .edu restriction.</p>
          <button className="outline-button" type="button" onClick={loadStudents} disabled={loading || saving}>
            Refresh
          </button>
        </div>
      </div>

      {notice.message ? <div className={`notice ${notice.type}`}>{notice.message}</div> : null}

      <section className="table-wrap">
        {loading ? (
          <div className="empty-state">Loading whitelist...</div>
        ) : students.length ? (
          <table>
            <thead>
              <tr>
                <th>TR No</th>
                <th>Email</th>
                <th>Full Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="gold-text">{student.trNo}</td>
                  <td>{student.email}</td>
                  <td>{student.fullName}</td>
                  <td>
                    <button className="danger-button small" type="button" onClick={() => removeStudent(student)} disabled={saving}>
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No whitelisted students found.</div>
        )}
      </section>
    </>
  );
}
