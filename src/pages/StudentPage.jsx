import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, GraduationCap, ShieldCheck } from 'lucide-react';
import { AuthCard } from '../components/AuthCard';
import { AppShell } from '../components/AppShell';
import { Loading } from '../components/Loading';
import {
  EMPTY_REGISTRATION,
  STAGES,
} from '../data/constants';
import { useAuth } from '../context/AuthContext';
import { getExamProof, getStudentRecord, saveStudentRegistration } from '../services/firestore';
import {
  canStudentEdit,
  clearDraft,
  nameFromGoogleUser,
  needsProgrammeDetails,
  readDraft,
  saveDraft,
  trFromStudentEmail,
} from '../utils/registration';
import { validateRegistration, validateRegistrationStep } from '../utils/validation';
import { ProfileLink } from './ProfileLink';
import { TashjeeStudentTab } from './TashjeeStudentTab';
import { RegistrationTab } from '../components/student/RegistrationFlow';
import { QualificationsTab } from '../components/student/QualificationsTab';

export function StudentPage() {
  const { user, profile, isAdmin } = useAuth();
  const [linked, setLinked] = useState(Boolean(profile?.trNo));

  useEffect(() => {
    setLinked(Boolean(profile?.trNo));
  }, [profile]);

  if (!user) return <AuthCard role="student" />;
  if (!linked || !profile?.trNo) return <ProfileLink onLinked={() => setLinked(true)} />;
  return <StudentDashboard isAdmin={isAdmin} />;
}

function StudentDashboard({ isAdmin }) {
  const { user, profile } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [activeTab, setActiveTab] = useState('registration');
  const [examProof, setExamProof] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [values, setValues] = useState({
    ...EMPTY_REGISTRATION,
    trNo: profile?.trNo || trFromStudentEmail(user.email),
    fullName: profile?.fullName || nameFromGoogleUser(user),
  });

  useEffect(() => {
    let alive = true;
    async function load() {
      const [existing, existingExamProof] = await Promise.all([
        getStudentRecord(user.uid),
        getExamProof(user.uid),
      ]);
      if (!alive) return;
      const draft = readDraft(user.uid);
      const identity = {
        trNo: profile?.trNo || trFromStudentEmail(user.email),
        fullName: profile?.fullName || nameFromGoogleUser(user),
      };
      setRecord(existing);
      setExamProof(existingExamProof);
      setValues({
        ...EMPTY_REGISTRATION,
        ...identity,
        ...(existing || {}),
        ...(existing?.status === 'approved' ? {} : draft || {}),
        ...identity,
      });
      setLoading(false);
    }
    load();
    return () => {
      alive = false;
    };
  }, [user, profile]);

  useEffect(() => {
    if (!loading && canStudentEdit(record)) saveDraft(user.uid, values);
  }, [values, user.uid, record, loading]);

  const editable = canStudentEdit(record);
  const stageLabels = useMemo(() => Object.fromEntries(STAGES.map((stage) => [stage.value, stage.shortLabel])), []);

  function patch(next) {
    setValues((current) => ({ ...current, ...next }));
    setMessage('');
  }

  function toggleArray(field, value) {
    const current = values[field] || [];
    patch({
      [field]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    });
  }

  function nextStep() {
    const stepErrors = validateRegistrationStep(step, values);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) return;
    setStep((current) => (!needsProgrammeDetails(values) && current === 1 ? 3 : Math.min(current + 1, 3)));
  }

  function prevStep() {
    setErrors({});
    setStep((current) => (!needsProgrammeDetails(values) && current === 3 ? 1 : Math.max(current - 1, 0)));
  }

  async function submit() {
    const stepErrors = validateRegistration(values);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) return;

    setSaving(true);
    setMessage('');
    try {
      await saveStudentRegistration(user, profile, values, record);
      const [nextRecord, nextExamProof] = await Promise.all([
        getStudentRecord(user.uid),
        getExamProof(user.uid),
      ]);
      setRecord(nextRecord);
      setExamProof(nextExamProof);
      clearDraft(user.uid);
      setMessage(
        nextRecord?.status === 'approved'
          ? 'Your registration has been automatically approved because no Idara assistance or leave support is needed.'
          : 'Your registration has been submitted. The Idara can now review the latest details.',
      );
    } catch (err) {
      setMessage(err.message || 'Unable to save registration.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading label="Loading student record" />;

  return (
    <AppShell>
      <main className="container student-space">
        <header className="page-heading dashboard-heading">
          <div>
            <p className="eyebrow">Student Dashboard</p>
            <h1>Further Studies Portal</h1>
            <p>Track your raza status and manage your further-studies registration from one place.</p>
          </div>
          {isAdmin ? (
            <Link className="outline-button" to="/admin" title="Go to admin dashboard">
              <ShieldCheck size={16} />
              Admin Portal
            </Link>
          ) : null}
        </header>

        <DashboardTabs activeTab={activeTab} record={record} onChange={setActiveTab} />

        {activeTab === 'registration' ? (
          <RegistrationTab
            editable={editable}
            errors={errors}
            examProof={examProof}
            message={message}
            record={record}
            saving={saving}
            stageLabels={stageLabels}
            step={step}
            values={values}
            nextStep={nextStep}
            patch={patch}
            prevStep={prevStep}
            submit={submit}
            toggleArray={toggleArray}
            user={user}
            onExamProofChange={setExamProof}
          />
        ) : null}

        {activeTab === 'qualifications' ? (
          <QualificationsTab
            user={user}
            legacyQualifications={record?.qualifications || []}
            legacyOtherQual={record?.otherQual || ''}
          />
        ) : null}

        {activeTab === 'tashjee' ? <TashjeeStudentTab user={user} profile={profile} /> : null}
      </main>
    </AppShell>
  );
}

function DashboardTabs({ activeTab, record, onChange }) {
  const registrationLabel = record?.status === 'approved' ? 'Approved Registration' : 'Student Registration';

  return (
    <nav className="dashboard-tabs" aria-label="Student dashboard sections">
      <button
        className={activeTab === 'registration' ? 'active' : ''}
        type="button"
        onClick={() => onChange('registration')}
      >
        <FileText size={16} />
        {registrationLabel}
      </button>
      <button className={activeTab === 'qualifications' ? 'active' : ''} type="button" onClick={() => onChange('qualifications')}>
        <GraduationCap size={16} />
        Qualifications
      </button>
      <button className={activeTab === 'tashjee' ? 'active' : ''} type="button" onClick={() => onChange('tashjee')}>
        <FileText size={16} />
        Tashjee Request
      </button>
      <button type="button" disabled>
        v2 Modules
      </button>
    </nav>
  );
}
