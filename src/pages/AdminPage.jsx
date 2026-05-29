import { AlertCircle, Search, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { AppShell } from '../components/AppShell';
import { Loading } from '../components/Loading';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { addAdmin, clearStudentRegistration, deleteAdmin, getAdmins, getAllStudents, updateStudentReview } from '../services/firestore';
import { filterStudents, statsForStudents } from '../utils/registration';
import { TashjeeAdminPanel } from './TashjeeAdminPanel';

const MAIN_ADMIN_EMAIL = 'idrislaheri72@gmail.com';

export function AdminPage() {
  const { user, isAdmin, refreshAccount } = useAuth();
  const [checkedFreshAccessFor, setCheckedFreshAccessFor] = useState('');

  useEffect(() => {
    let active = true;

    if (!user || isAdmin || checkedFreshAccessFor === user.email) return undefined;

    refreshAccount(user)
      .catch(() => null)
      .finally(() => {
        if (active) setCheckedFreshAccessFor(user.email);
      });

    return () => {
      active = false;
    };
  }, [checkedFreshAccessFor, isAdmin, refreshAccount, user]);

  if (!user) return <AuthCard role="admin" />;
  if (!isAdmin && checkedFreshAccessFor !== user.email) return <Loading />;
  if (!isAdmin) return <Navigate to="/unauthorized" replace />;
  return <AdminDashboard />;
}

function AdminDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManageAdmins = user?.email?.toLowerCase() === MAIN_ADMIN_EMAIL;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'tashjee' || (tabParam === 'access' && canManageAdmins) ? tabParam : 'records';

  async function load() {
    setLoading(true);
    setError('');
    try {
      setStudents(await getAllStudents());
    } catch (err) {
      setError(err.message || 'Unable to load student records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => filterStudents(students, query, status), [students, query, status]);
  const stats = useMemo(() => statsForStudents(students), [students]);

  return (
    <AppShell title="Admin Dashboard">
      <main className="container wide admin-space">
        <header className="page-heading admin-heading">
          <div>
            <p className="eyebrow">Further Studies</p>
            <h1>Student Records</h1>
            <p>Search, review, approve, and leave notes for students.</p>
          </div>
          <button className="outline-button" type="button" onClick={load}>
            Refresh
          </button>
        </header>

        <nav className="dashboard-tabs admin-tabs" aria-label="Admin dashboard sections">
          <button className={activeTab === 'records' ? 'active' : ''} type="button" onClick={() => setSearchParams({}, { replace: true })}>
            Student Records
          </button>
          <button className={activeTab === 'tashjee' ? 'active' : ''} type="button" onClick={() => setSearchParams({ tab: 'tashjee' }, { replace: true })}>
            Tashjee Management
          </button>
          {canManageAdmins ? (
            <button className={activeTab === 'access' ? 'active' : ''} type="button" onClick={() => setSearchParams({ tab: 'access' }, { replace: true })}>
              Admin Access
            </button>
          ) : null}
        </nav>

        {activeTab === 'records' ? (
          loading ? (
            <div className="empty-state">Loading student records...</div>
          ) : (
            <>
              <section className="stats-grid">
                <StatCard label="Total Students" value={stats.total} tone="gold" />
                <StatCard label="Pending" value={stats.pending} tone="warning" />
                <StatCard label="On Hold" value={stats.onHold} tone="hold" />
                <StatCard label="Approved" value={stats.approved} tone="success" />
                <StatCard label="Miqaat Clashes" value={stats.clashes} tone="danger" />
              </section>

              <section className="admin-tools">
                <label className="search-box">
                  <Search size={17} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by TR, name, email, degree, institution"
                  />
                </label>
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="on-hold">On Hold</option>
                  <option value="approved">Approved</option>
                </select>
              </section>

              {error ? <div className="notice danger">{error}</div> : null}

              <section className="table-wrap">
                {filtered.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>TR</th>
                        <th>Student</th>
                        <th>Raza Days / Year</th>
                        <th>Degree</th>
                        <th>Exams</th>
                        <th>Clash</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((student) => (
                        <tr key={student.id}>
                          <td className="gold-text">{student.trNo}</td>
                          <td>{student.fullName}</td>
                          <td className="muted-cell">{student.razaDays ? `${student.razaDays} days` : '-'}</td>
                          <td>{student.degreeApplying || '-'}</td>
                          <td>{student.examMonths?.slice(0, 3).join(', ') || '-'}</td>
                          <td>{student.clashWithMiqaat ? <span className="danger-text">Yes</span> : '-'}</td>
                          <td>
                            <StatusBadge status={student.status} />
                          </td>
                          <td>
                            <button className="outline-button small" type="button" onClick={() => setSelected(student)}>
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">{students.length ? 'No records match your search.' : 'No student registrations yet.'}</div>
                )}
              </section>
            </>
          )
        ) : activeTab === 'tashjee' ? (
          <TashjeeAdminPanel />
        ) : (
          <AdminAccessPanel currentUser={user} />
        )}
      </main>
      {activeTab === 'records' && selected ? (
        <ReviewModal
          student={selected}
          reviewer={user}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setStudents((current) => current.map((student) => (student.id === updated.id ? updated : student)));
            setSelected(null);
          }}
          onCleared={(uid) => {
            setStudents((current) => current.filter((student) => student.id !== uid));
            setSelected(null);
          }}
        />
      ) : null}
    </AppShell>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AdminAccessPanel({ currentUser }) {
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
    </section>
  );
}

function ReviewModal({ student, reviewer, onClose, onSaved, onCleared }) {
  const [status, setStatus] = useState(['pending', 'on-hold', 'approved'].includes(student.status) ? student.status : 'pending');
  const [adminNotes, setAdminNotes] = useState(student.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    if (status === 'on-hold' && !adminNotes.trim()) {
      setError('Please add a note so the student knows what to clarify.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateStudentReview(student.id, reviewer, status, adminNotes);
      onSaved({ ...student, status, adminNotes, reviewedBy: reviewer.email });
    } catch (err) {
      setError(err.message || 'Unable to save review.');
      setSaving(false);
    }
  }

  async function clearRegistration() {
    const confirmed = window.confirm(
      `Permanently clear ${student.fullName || student.email}'s further-studies registration? They will be able to fill the form again from the start.`,
    );
    if (!confirmed) return;

    setSaving(true);
    setError('');
    try {
      await clearStudentRegistration(student.id);
      onCleared(student.id);
    } catch (err) {
      setError(err.message || 'Unable to clear this registration.');
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Review Record</p>
            <h2 id="review-title">{student.fullName}</h2>
            <p>{student.trNo} · {student.email}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close review modal">
            <X size={18} />
          </button>
        </header>

        <div className="detail-grid">
          {[
            ['Degree', student.degreeApplying],
            ['Institution', student.institution],
            ['Study Commitment', student.studyCommitment],
            ['Raza Days / Year', student.razaDays ? `${student.razaDays} days` : ''],
            ['Exam Months', student.examMonths?.join(', ')],
            ['Qualifications', student.qualifications?.join(', ')],
            ['Miqaat Clash', student.clashWithMiqaat ? `Yes - ${student.clashEvents?.join(', ') || 'Details provided'}` : 'No'],
            ['Student Notes', student.additionalNotes],
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div className="detail-cell" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
        </div>

        <div className="split-choice modal-choice">
          {['pending', 'on-hold', 'approved'].map((nextStatus) => (
            <button
              className={`choice-card ${status === nextStatus ? 'selected' : ''}`}
              type="button"
              onClick={() => setStatus(nextStatus)}
              key={nextStatus}
            >
              {nextStatus === 'on-hold' ? <AlertCircle size={16} /> : <ShieldCheck size={16} />}
              {nextStatus === 'approved' ? 'Approved' : nextStatus === 'on-hold' ? 'On Hold' : 'Pending'}
            </button>
          ))}
        </div>

        <label>
          Notes visible to student {status === 'on-hold' ? '(required)' : ''}
          <textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} />
        </label>

        {error ? <div className="notice danger">{error}</div> : null}

        <div className="form-actions">
          <div className="modal-danger-actions">
            <button className="danger-button" type="button" onClick={clearRegistration} disabled={saving}>
              <Trash2 size={15} />
              Clear Registration
            </button>
          </div>
          <div className="modal-save-actions">
            <button className="outline-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="gold-button" type="button" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Review'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
