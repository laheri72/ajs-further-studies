import { AlertCircle, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { AppShell } from '../components/AppShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { clearStudentRegistration, getAllStudents, updateStudentReview } from '../services/firestore';
import { filterStudents, statsForStudents } from '../utils/registration';
import { TashjeeAdminPanel } from './TashjeeAdminPanel';

export function AdminPage() {
  const { user, isAdmin } = useAuth();

  if (!user) return <AuthCard role="admin" />;
  if (!isAdmin) return <Navigate to="/unauthorized" replace />;
  return <AdminDashboard />;
}

function AdminDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const activeTab = searchParams.get('tab') === 'tashjee' ? 'tashjee' : 'records';

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
        ) : (
          <TashjeeAdminPanel />
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
