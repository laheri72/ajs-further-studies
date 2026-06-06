import { GraduationCap, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { AppShell } from '../components/AppShell';
import { Loading } from '../components/Loading';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { getAllStudents } from '../services/firestore';
import { filterStudents, statsForStudents } from '../utils/registration';
import { TashjeeAdminPanel } from './TashjeeAdminPanel';
import { AdminAccessPanel } from '../components/admin/AdminAccessPanel';
import { ReviewModal } from '../components/admin/ReviewModal';
import { MAIN_ADMIN_EMAIL } from '../data/constants';

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
          <div className="admin-header-actions">
            <Link className="outline-button" to="/student" title="Go to my student registration">
              <GraduationCap size={16} />
              Student Portal
            </Link>
            <button className="outline-button" type="button" onClick={load}>
              Refresh
            </button>
          </div>
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

