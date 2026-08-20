import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Laptop,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  TicketCheck,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { AppShell } from '../components/AppShell';
import { Loading } from '../components/Loading';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { getAllStudents, getExamProof, subscribeAllResults } from '../services/firestore';
import { isAutoApprovedRecord, isManuallyApprovedRecord, statsForStudents } from '../utils/registration';
import { examProofStateLabel } from '../utils/proofUpload';
import { exportToExcel, exportToPDF } from '../utils/exportData';
import { ResultsAdminPanel } from '../components/admin/ResultsAdminPanel';
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
  const [proofFilter, setProofFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortKey, setSortKey] = useState('submittedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [pendingResultsCount, setPendingResultsCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeAllResults(
      (data) => {
        const count = data.filter((r) => !r.status || r.status === 'pending').length;
        setPendingResultsCount(count);
      },
      () => setPendingResultsCount(0),
    );
    return () => unsubscribe();
  }, []);

  const tabParam = searchParams.get('tab');
  const activeTab =
    tabParam === 'records' || tabParam === 'results' || (tabParam === 'access' && canManageAdmins)
      ? tabParam
      : 'analysis';

  async function load() {
    setLoading(true);
    setError('');
    try {
      const studentRecords = await getAllStudents();
      const recordsWithProof = await Promise.all(
        studentRecords.map(async (student) => ({
          ...student,
          examProof: await getExamProof(student.id).catch(() => null),
        })),
      );
      setStudents(recordsWithProof);
    } catch (err) {
      setError(err.message || 'Unable to load student records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function resetFilters() {
    setQuery('');
    setStatus('all');
    setProofFilter('all');
    setRiskFilter('all');
    setSortKey('submittedAt');
    setSortDir('desc');
  }

  const filtered = useMemo(
    () => filterStudentRecords(students, query, status, proofFilter, riskFilter),
    [students, query, status, proofFilter, riskFilter],
  );

  const sortedStudents = useMemo(() => {
    return [...filtered].sort((left, right) => {
      let valA = left[sortKey];
      let valB = right[sortKey];

      if (sortKey === 'examProof') {
        valA = left.examProof?.state || 'missing';
        valB = right.examProof?.state || 'missing';
      } else if (sortKey === 'razaDays') {
        valA = Number(left.razaDays || 0);
        valB = Number(right.razaDays || 0);
      } else if (sortKey === 'submittedAt') {
        valA = left.submittedAt?.seconds || 0;
        valB = right.submittedAt?.seconds || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const stats = useMemo(() => statsForStudents(students), [students]);
  const reviewMetrics = useMemo(() => buildReviewMetrics(students), [students]);
  const eventPressure = useMemo(
    () => topCounts(students.flatMap((student) => student.clashEvents || []), 5),
    [students],
  );
  const monthPressure = useMemo(
    () => topCounts(students.flatMap((student) => student.examMonths || []), 6),
    [students],
  );

  function exportRecordsExcel() {
    const columns = [
      { key: 'trNo', label: 'TR Number' },
      { key: 'fullName', label: 'Student Name' },
      { key: 'email', label: 'Email' },
      { key: 'degreeApplying', label: 'Degree / Programme' },
      { key: 'institution', label: 'Institution' },
      { key: 'studyCommitment', label: 'Study Commitment' },
      { key: 'razaDays', label: 'Raza Days' },
      { key: 'examMonths', label: 'Exam Months' },
      { key: 'clashWithMiqaat', label: 'Miqaat Clash' },
      { key: 'clashEvents', label: 'Clash Events' },
      { key: 'clashDetails', label: 'Clash Details' },
      { key: 'needsLaptop', label: 'Further Allowances' },
      { key: 'laptopJustification', label: 'Allowance Details' },
      { key: 'proofState', label: 'Hall Ticket State' },
      { key: 'status', label: 'Status' },
      { key: 'submittedAtDate', label: 'Submitted Date' },
      { key: 'adminNotes', label: 'Idara Notes' },
    ];

    const exportRows = sortedStudents.map((s) => ({
      ...s,
      clashWithMiqaat: s.clashWithMiqaat ? 'Yes' : 'No',
      needsLaptop: s.needsLaptop ? 'Yes' : 'No',
      proofState: examProofStateLabel(s.examProof?.state),
      submittedAtDate: s.submittedAt?.seconds
        ? new Date(s.submittedAt.seconds * 1000).toLocaleDateString()
        : '-',
    }));

    exportToExcel('External_Examinations_Student_Records', 'Student Records', columns, exportRows);
  }

  function exportRecordsPDF() {
    const columns = [
      { key: 'trNo', label: 'TR' },
      { key: 'fullName', label: 'Student Name' },
      { key: 'degreeApplying', label: 'Programme' },
      { key: 'institution', label: 'Institution' },
      { key: 'razaDays', label: 'Raza Days' },
      { key: 'proofState', label: 'Hall Ticket' },
      { key: 'status', label: 'Status' },
      { key: 'submittedAtDate', label: 'Submitted' },
    ];

    const exportRows = sortedStudents.map((s) => ({
      ...s,
      razaDays: s.razaDays ? `${s.razaDays} days` : '-',
      proofState: examProofStateLabel(s.examProof?.state),
      submittedAtDate: s.submittedAt?.seconds
        ? new Date(s.submittedAt.seconds * 1000).toLocaleDateString()
        : '-',
    }));

    exportToPDF('External_Examinations_Student_Records', 'Student Records Administrative Audit Report', columns, exportRows);
  }

  const hasActiveFilters =
    query.trim() || status !== 'all' || proofFilter !== 'all' || riskFilter !== 'all' || sortKey !== 'submittedAt';

  return (
    <AppShell title="External Examinations Portal">
      <main className="container wide admin-space">
        <header className="page-heading admin-heading">
          <div>
            <p className="eyebrow">Imtehanaat-Ukhra</p>
            <h1>External Examinations — Admin Command Center</h1>
            <p>Institutional management dashboard to monitor analytics, verify hall tickets, and govern raza approvals.</p>
          </div>
          <div className="admin-header-actions">
            <button className="outline-button" type="button" onClick={load}>
              Refresh Data
            </button>
          </div>
        </header>

        <nav className="dashboard-tabs admin-tabs" aria-label="Admin dashboard sections">
          <button
            className={activeTab === 'analysis' ? 'active' : ''}
            type="button"
            onClick={() => setSearchParams({ tab: 'analysis' }, { replace: true })}
          >
            <BarChart3 size={16} />
            Analysis & Analytics
          </button>
          <button
            className={activeTab === 'records' ? 'active' : ''}
            type="button"
            onClick={() => setSearchParams({ tab: 'records' }, { replace: true })}
          >
            <Users size={16} />
            Student Records ({students.length})
          </button>
          <button
            className={activeTab === 'results' ? 'active' : ''}
            type="button"
            onClick={() => setSearchParams({ tab: 'results' }, { replace: true })}
          >
            <FileCheck2 size={16} />
            Results Management ({pendingResultsCount})
          </button>
          {canManageAdmins ? (
            <button
              className={activeTab === 'access' ? 'active' : ''}
              type="button"
              onClick={() => setSearchParams({ tab: 'access' }, { replace: true })}
            >
              <ShieldCheck size={16} />
              Admin Governance
            </button>
          ) : null}
        </nav>

        {activeTab === 'analysis' ? (
          loading ? (
            <div className="empty-state">Calculating metrics...</div>
          ) : (
            <>
              <section className="stats-grid">
                <ReviewMetricCard
                  icon={<Users size={19} />}
                  label="Total Registrations"
                  value={stats.total}
                  caption="Total registered students in system"
                  tone="gold"
                />
                <ReviewMetricCard
                  icon={<Clock size={19} />}
                  label="Pending Review"
                  value={stats.pending}
                  caption="Applications awaiting Idara action"
                  tone="warning"
                />
                <ReviewMetricCard
                  icon={<AlertCircle size={19} />}
                  label="On Hold"
                  value={stats.onHold}
                  caption="Records flagged for student clarification"
                  tone="hold"
                />
                <ReviewMetricCard
                  icon={<CheckCircle2 size={19} />}
                  label="Approved by Idara"
                  value={stats.manuallyApproved}
                  caption="Finalized and approved by Idara reviewers"
                  tone="success"
                />
                <ReviewMetricCard
                  icon={<ShieldCheck size={19} />}
                  label="Auto-Approved"
                  value={stats.autoApproved}
                  caption="System auto-approved (0 Raza / assistance needed)"
                  tone="gold"
                />
                <ReviewMetricCard
                  icon={<Laptop size={19} />}
                  label="Further Allowances"
                  value={stats.laptopRaza}
                  caption="Students requesting laptop/allowance raza"
                  tone="warning"
                />
                <ReviewMetricCard
                  icon={<AlertTriangle size={19} />}
                  label="Miqaat Clashes"
                  value={stats.clashes}
                  caption="Students with Miqaat event conflicts"
                  tone="danger"
                />
              </section>

              <section className="admin-analytics-grid">
                <ReviewMetricCard
                  icon={<TicketCheck size={19} />}
                  label="Hall Tickets Ready"
                  value={reviewMetrics.proofUploaded}
                  caption={`${reviewMetrics.pendingProofUploaded} pending records have proof ready to verify`}
                  tone="success"
                />
                <ReviewMetricCard
                  icon={<ShieldAlert size={19} />}
                  label="Proof Missing"
                  value={reviewMetrics.proofMissing}
                  caption={`${reviewMetrics.pendingProofMissing} pending students still need hall-ticket proof`}
                  tone="danger"
                />
                <ReviewMetricCard
                  icon={<CalendarDays size={19} />}
                  label="Leave Days Requested"
                  value={reviewMetrics.totalLeaveDays}
                  caption={`${reviewMetrics.highLeaveRequests} students request 10 or more days`}
                  tone="warning"
                />
                <ReviewMetricCard
                  icon={<AlertTriangle size={19} />}
                  label="Clash Cases"
                  value={reviewMetrics.clashCount}
                  caption={`${reviewMetrics.clashLeaveDays} leave days are tied to declared clashes`}
                  tone="danger"
                />
              </section>

              <section className="admin-pressure-grid">
                <PressurePanel title="Event Clashes" emptyLabel="No clash events declared yet." items={eventPressure} />
                <PressurePanel title="Exam Month Clashes" emptyLabel="No exam months selected yet." items={monthPressure} />
              </section>
            </>
          )
        ) : activeTab === 'records' ? (
          loading ? (
            <div className="empty-state">Loading student records...</div>
          ) : (
            <>
              <section className="admin-tools-enterprise">
                <div className="admin-tools-filters">
                  <label className="search-box">
                    <Search size={17} />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search by TR, name, email, degree, institution..."
                    />
                  </label>
                  <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="on-hold">On Hold</option>
                    <option value="approved">All Approved</option>
                    <option value="manually-approved">Approved by Idara</option>
                    <option value="auto-approved">Auto-Approved (No Raza)</option>
                  </select>
                  <select value={proofFilter} onChange={(event) => setProofFilter(event.target.value)}>
                    <option value="all">All Proof States</option>
                    <option value="uploaded">Hall Ticket Uploaded</option>
                    <option value="not_generated_yet">Not Generated Yet</option>
                    <option value="missing">Proof Missing</option>
                  </select>
                  <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
                    <option value="all">All Review Focus</option>
                    <option value="needs-review">Needs Review</option>
                    <option value="clash">Clash Declared</option>
                    <option value="high-leave">High Leave Days</option>
                  </select>
                </div>

                <div className="admin-tools-actions">
                  <span className="record-count-badge">
                    Showing <strong>{sortedStudents.length}</strong> of {students.length} records
                  </span>
                  <button className="gold-button small" type="button" onClick={exportRecordsExcel} title="Export current dataset to MS Excel (.xlsx)">
                    <FileSpreadsheet size={15} />
                    Export Excel (.xlsx)
                  </button>
                  <button className="outline-button small" type="button" onClick={exportRecordsPDF} title="Export current dataset to PDF report (.pdf)">
                    <FileText size={15} />
                    Export PDF (.pdf)
                  </button>
                  {hasActiveFilters ? (
                    <button className="outline-button small danger-pill" type="button" onClick={resetFilters} title="Reset search & filters">
                      <RotateCcw size={14} />
                      Reset
                    </button>
                  ) : null}
                </div>
              </section>

              {error ? <div className="notice danger">{error}</div> : null}

              <section className="table-wrap">
                {sortedStudents.length ? (
                  <table>
                    <thead>
                      <tr>
                        <SortableTh label="TR" columnKey="trNo" currentSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                        <SortableTh label="Student" columnKey="fullName" currentSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                        <th>Review Focus</th>
                        <SortableTh label="Hall Ticket" columnKey="examProof" currentSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                        <SortableTh label="Raza Days" columnKey="razaDays" currentSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                        <SortableTh label="Degree" columnKey="degreeApplying" currentSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                        <th>Exam Months</th>
                        <th>Clash Events</th>
                        <SortableTh label="Status" columnKey="status" currentSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedStudents.map((student) => (
                        <tr key={student.id}>
                          <td className="gold-text">{student.trNo}</td>
                          <td>
                            <strong>{student.fullName}</strong>
                            <span className="table-subtext">{student.email}</span>
                          </td>
                          <td>
                            <ReviewFocus student={student} />
                          </td>
                          <td>
                            <ProofCell proof={student.examProof} />
                          </td>
                          <td className={Number(student.razaDays || 0) >= 10 ? 'danger-text' : 'muted-cell'}>
                            {student.razaDays ? `${student.razaDays} days` : '-'}
                          </td>
                          <td>{student.degreeApplying || '-'}</td>
                          <td>
                            <PillSummary items={student.examMonths || []} emptyLabel="-" />
                          </td>
                          <td>
                            {student.clashWithMiqaat ? <PillSummary items={student.clashEvents || []} emptyLabel="Details provided" danger /> : '-'}
                          </td>
                          <td>
                            <StatusBadge status={student.status} isAuto={isAutoApprovedRecord(student)} />
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
                  <div className="empty-state">{students.length ? 'No records match your search filter.' : 'No student registrations yet.'}</div>
                )}
              </section>
            </>
          )
        ) : activeTab === 'results' ? (
          <ResultsAdminPanel />
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

function SortableTh({ label, columnKey, currentSortKey, sortDir, onSort }) {
  const isSorted = currentSortKey === columnKey;
  return (
    <th className="sortable-th" onClick={() => onSort(columnKey)}>
      <button className="sort-th-button" type="button">
        <span>{label}</span>
        {isSorted ? (
          sortDir === 'asc' ? <ArrowUp size={14} className="sort-icon active" /> : <ArrowDown size={14} className="sort-icon active" />
        ) : (
          <ArrowUpDown size={13} className="sort-icon muted" />
        )}
      </button>
    </th>
  );
}

function ReviewMetricCard({ icon, label, value, caption, tone }) {
  return (
    <article className={`review-metric-card ${tone}`}>
      <div className="review-metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{caption}</p>
      </div>
    </article>
  );
}

function PressurePanel({ title, items, emptyLabel }) {
  return (
    <section className="pressure-panel">
      <div className="pressure-panel-head">
        <FileCheck2 size={17} />
        <h2>{title}</h2>
      </div>
      {items.length ? (
        <div className="pressure-list">
          {items.map((item) => (
            <div className="pressure-row" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="pressure-empty">{emptyLabel}</div>
      )}
    </section>
  );
}

function ReviewFocus({ student }) {
  const focusItems = [];
  if (student.status === 'pending') focusItems.push({ label: 'Pending Review', tone: 'warning' });
  if (!student.examProof?.state || student.examProof.state === 'not_generated_yet') focusItems.push({ label: 'Proof Needed', tone: 'danger' });
  if (student.examProof?.state === 'uploaded') focusItems.push({ label: 'Verify Proof', tone: 'success' });
  if (student.clashWithMiqaat) focusItems.push({ label: 'Clash', tone: 'danger' });
  if (Number(student.razaDays || 0) >= 10) focusItems.push({ label: 'High Leave', tone: 'warning' });

  if (!focusItems.length) return <span className="muted-cell">Routine</span>;

  return (
    <div className="focus-chip-list">
      {focusItems.slice(0, 3).map((item) => (
        <span className={`focus-chip ${item.tone}`} key={item.label}>
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ProofCell({ proof }) {
  const state = proof?.state || 'missing';
  const uploaded = state === 'uploaded';
  return (
    <div className="proof-cell">
      <span className={`focus-chip ${uploaded ? 'success' : state === 'not_generated_yet' ? 'warning' : 'danger'}`}>
        {examProofStateLabel(state)}
      </span>
      {uploaded ? (
        <a href={proof.proofPreviewUrl || proof.proofUrl} target="_blank" rel="noreferrer">
          Open
        </a>
      ) : null}
    </div>
  );
}

function PillSummary({ items, emptyLabel, danger = false }) {
  const visibleItems = items.filter(Boolean);
  if (!visibleItems.length) return <span className="muted-cell">{emptyLabel}</span>;
  return (
    <div className="table-pill-list">
      {visibleItems.slice(0, 3).map((item) => (
        <span className={`table-pill ${danger ? 'danger' : ''}`} key={item}>
          {item}
        </span>
      ))}
      {visibleItems.length > 3 ? <span className="table-pill muted">+{visibleItems.length - 3}</span> : null}
    </div>
  );
}

function filterStudentRecords(students, query, status, proofFilter, riskFilter) {
  const q = String(query || '').trim().toLowerCase();
  return students.filter((student) => {
    const proofState = student.examProof?.state || 'missing';
    let matchesStatus = status === 'all' || student.status === status;
    if (status === 'auto-approved') matchesStatus = isAutoApprovedRecord(student);
    if (status === 'manually-approved') matchesStatus = isManuallyApprovedRecord(student);
    const matchesProof = proofFilter === 'all' || proofState === proofFilter;
    const matchesRisk =
      riskFilter === 'all' ||
      (riskFilter === 'needs-review' && student.status === 'pending') ||
      (riskFilter === 'clash' && student.clashWithMiqaat) ||
      (riskFilter === 'high-leave' && Number(student.razaDays || 0) >= 10);
    const haystack = [
      student.trNo,
      student.fullName,
      student.email,
      student.degreeApplying,
      student.institution,
      ...(student.examMonths || []),
      ...(student.clashEvents || []),
      proofState,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return matchesStatus && matchesProof && matchesRisk && (!q || haystack.includes(q));
  });
}

function buildReviewMetrics(students) {
  const proofUploaded = students.filter((student) => student.examProof?.state === 'uploaded').length;
  const proofMissing = students.filter(
    (student) => !student.examProof?.state || student.examProof?.state === 'not_generated_yet',
  ).length;
  const pendingStudents = students.filter((student) => student.status === 'pending');
  const clashStudents = students.filter((student) => student.clashWithMiqaat);

  return {
    proofUploaded,
    pendingProofUploaded: pendingStudents.filter((student) => student.examProof?.state === 'uploaded').length,
    proofMissing,
    pendingProofMissing: pendingStudents.filter(
      (student) => !student.examProof?.state || student.examProof?.state === 'not_generated_yet',
    ).length,
    totalLeaveDays: students.reduce((sum, student) => sum + Number(student.razaDays || 0), 0),
    highLeaveRequests: students.filter((student) => Number(student.razaDays || 0) >= 10).length,
    clashCount: clashStudents.length,
    clashLeaveDays: clashStudents.reduce((sum, student) => sum + Number(student.razaDays || 0), 0),
  };
}

function topCounts(values, limit) {
  const counts = values.reduce((acc, value) => {
    const label = String(value || '').trim();
    if (!label) return acc;
    acc.set(label, (acc.get(label) || 0) + 1);
    return acc;
  }, new Map());

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, limit);
}
