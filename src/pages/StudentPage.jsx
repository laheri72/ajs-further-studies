import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Lock, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AuthCard } from '../components/AuthCard';
import { AppShell } from '../components/AppShell';
import { Loading } from '../components/Loading';
import { StatusBadge } from '../components/StatusBadge';
import {
  EMPTY_REGISTRATION,
  MIQAAT_EVENTS,
  MONTHS,
  QUALIFICATIONS,
  STAGES,
  STUDENT_STEPS,
} from '../data/constants';
import { useAuth } from '../context/AuthContext';
import { getStudentRecord, saveStudentRegistration } from '../services/firestore';
import { canStudentEdit, clearDraft, readDraft, saveDraft } from '../utils/registration';
import { validateRegistration, validateRegistrationStep } from '../utils/validation';
import { ProfileLink } from './ProfileLink';

export function StudentPage() {
  const { user, profile } = useAuth();
  const [linked, setLinked] = useState(Boolean(profile?.trNo));

  useEffect(() => {
    setLinked(Boolean(profile?.trNo));
  }, [profile]);

  if (!user) return <AuthCard role="student" />;
  if (!linked || !profile?.trNo) return <ProfileLink onLinked={() => setLinked(true)} />;
  return <StudentDashboard />;
}

function StudentDashboard() {
  const { user, profile } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [values, setValues] = useState({
    ...EMPTY_REGISTRATION,
    trNo: profile.trNo,
    fullName: profile.fullName,
  });

  useEffect(() => {
    let alive = true;
    async function load() {
      const existing = await getStudentRecord(user.uid);
      if (!alive) return;
      const draft = readDraft(user.uid);
      setRecord(existing);
      setValues({
        ...EMPTY_REGISTRATION,
        trNo: profile.trNo,
        fullName: profile.fullName,
        ...(existing || {}),
        ...(existing?.status === 'approved' ? {} : draft || {}),
      });
      setLoading(false);
    }
    load();
    return () => {
      alive = false;
    };
  }, [user.uid, profile]);

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
    setStep((current) => (values.hasThoughtAboutNext === false && current === 2 ? 4 : Math.min(current + 1, 4)));
  }

  function prevStep() {
    setErrors({});
    setStep((current) => (values.hasThoughtAboutNext === false && current === 4 ? 2 : Math.max(current - 1, 0)));
  }

  async function submit() {
    const stepErrors = validateRegistration(values);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) return;

    setSaving(true);
    setMessage('');
    try {
      await saveStudentRegistration(user, profile, values, record);
      const nextRecord = await getStudentRecord(user.uid);
      setRecord(nextRecord);
      clearDraft(user.uid);
      setMessage('Your registration has been saved. The Idara can now review the latest details.');
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
        {record ? <StatusPanel record={record} editable={editable} /> : null}
        <header className="page-heading">
          <p className="eyebrow">Student Registration</p>
          <h1>{editable ? 'Further Studies Registration' : 'Approved Registration'}</h1>
          <p>
            {editable
              ? 'Complete each section carefully. Your draft is saved locally on this device.'
              : 'Your record has been approved by the Idara and is now read-only.'}
          </p>
        </header>
        <Stepper step={step} />
        <section className={`panel ${editable ? '' : 'read-only'}`}>
          {!editable ? (
            <div className="notice success">
              <Lock size={16} /> Approved records cannot be edited from the student portal.
            </div>
          ) : null}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <StepContent
                step={step}
                values={values}
                errors={errors}
                stageLabels={stageLabels}
                editable={editable}
                patch={patch}
                toggleArray={toggleArray}
              />
            </motion.div>
          </AnimatePresence>
          {message ? <div className={`notice ${message.includes('Unable') ? 'danger' : 'success'}`}>{message}</div> : null}
          <div className="form-actions">
            <button className="outline-button" type="button" onClick={prevStep} disabled={step === 0}>
              Back
            </button>
            {step < 4 ? (
              <button className="gold-button" type="button" onClick={nextStep}>
                Continue
              </button>
            ) : (
              <button className="gold-button" type="button" onClick={submit} disabled={!editable || saving}>
                <Save size={16} />
                {saving ? 'Saving...' : record ? 'Save Updates' : 'Submit Registration'}
              </button>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function StatusPanel({ record, editable }) {
  return (
    <section className={`status-panel ${record.status === 'approved' ? 'approved' : 'pending'}`}>
      <div>
        <p className="eyebrow">Raza Status</p>
        <h2>{record.status === 'approved' ? 'Approved' : 'Pending Review'}</h2>
        <p>
          {record.status === 'approved'
            ? 'This is a preliminary raza with regard to your programme. Final raza to attend examinations will be on JHS.'
            : 'Your details are recorded. Please visit the Idara if you are close to examinations.'}
        </p>
      </div>
      <StatusBadge status={record.status} />
      {record.adminNotes ? (
        <div className="admin-note">
          <span>Notes from Idara</span>
          <p>{record.adminNotes}</p>
        </div>
      ) : null}
      {!editable ? <div className="read-only-line">Approved records are locked for student editing.</div> : null}
    </section>
  );
}

function Stepper({ step }) {
  return (
    <div className="stepper">
      {STUDENT_STEPS.map((label, index) => (
        <div className={`stepper-item ${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`} key={label}>
          <span>{index < step ? <CheckCircle2 size={15} /> : index + 1}</span>
          <small>{label}</small>
        </div>
      ))}
    </div>
  );
}

function StepContent({ step, values, errors, stageLabels, editable, patch, toggleArray }) {
  if (step === 0) {
    return (
      <div className="form-section">
        <h2>Student Details</h2>
        <div className="form-grid">
          <label>
            TR Number
            <input value={values.trNo} readOnly />
          </label>
          <label>
            Full Name
            <input value={values.fullName} readOnly />
          </label>
        </div>
        <p className="muted">These fields are linked to your Google account profile.</p>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="form-section">
        <h2>Qualifications Acquired</h2>
        <div className="choice-grid">
          {QUALIFICATIONS.map((qualification) => (
            <button
              className={`choice-card ${values.qualifications.includes(qualification) ? 'selected' : ''}`}
              type="button"
              disabled={!editable}
              onClick={() => toggleArray('qualifications', qualification)}
              key={qualification}
            >
              {qualification}
            </button>
          ))}
        </div>
        {errors.qualifications ? <span className="field-error">{errors.qualifications}</span> : null}
        {values.qualifications.includes('Other') ? (
          <label>
            Please specify
            <input
              value={values.otherQual}
              disabled={!editable}
              onChange={(event) => patch({ otherQual: event.target.value })}
            />
            {errors.otherQual ? <span className="field-error">{errors.otherQual}</span> : null}
          </label>
        ) : null}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="form-section">
        <h2>Next Qualification</h2>
        <p className="muted">Have you thought about acquiring the next qualification?</p>
        <div className="split-choice">
          {[true, false].map((answer) => (
            <button
              className={`choice-card ${values.hasThoughtAboutNext === answer ? 'selected' : ''}`}
              type="button"
              disabled={!editable}
              onClick={() =>
                patch({
                  hasThoughtAboutNext: answer,
                  stage: answer ? values.stage : '',
                  requiresAssistance: answer ? null : values.requiresAssistance,
                })
              }
              key={String(answer)}
            >
              {answer ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
        {errors.hasThoughtAboutNext ? <span className="field-error">{errors.hasThoughtAboutNext}</span> : null}
        {values.hasThoughtAboutNext === true ? (
          <div className="stack">
            {STAGES.map((stage) => (
              <button
                className={`choice-card left ${values.stage === stage.value ? 'selected' : ''}`}
                type="button"
                disabled={!editable}
                onClick={() => patch({ stage: stage.value })}
                key={stage.value}
              >
                {stage.label}
              </button>
            ))}
            {errors.stage ? <span className="field-error">{errors.stage}</span> : null}
          </div>
        ) : null}
        {values.hasThoughtAboutNext === false ? (
          <div className="split-choice">
            {[true, false].map((answer) => (
              <button
                className={`choice-card ${values.requiresAssistance === answer ? 'selected' : ''}`}
                type="button"
                disabled={!editable}
                onClick={() => patch({ requiresAssistance: answer })}
                key={String(answer)}
              >
                {answer ? 'Idara help needed' : 'No assistance needed'}
              </button>
            ))}
          </div>
        ) : null}
        {errors.requiresAssistance ? <span className="field-error">{errors.requiresAssistance}</span> : null}
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="form-section">
        <h2>Programme Details</h2>
        <div className="form-grid">
          <label>
            Degree / Programme Applying For
            <input
              value={values.degreeApplying}
              disabled={!editable}
              onChange={(event) => patch({ degreeApplying: event.target.value })}
              placeholder="LLB, MBBS, BSc Computer Science"
            />
            {errors.degreeApplying ? <span className="field-error">{errors.degreeApplying}</span> : null}
          </label>
          <label>
            Institution / University
            <input
              value={values.institution}
              disabled={!editable}
              onChange={(event) => patch({ institution: event.target.value })}
            />
          </label>
        </div>
        <label>
          Study Commitment
          <textarea
            value={values.studyCommitment}
            disabled={!editable}
            onChange={(event) => patch({ studyCommitment: event.target.value })}
            placeholder="Full-time, evenings, 3 days per week..."
          />
          {errors.studyCommitment ? <span className="field-error">{errors.studyCommitment}</span> : null}
        </label>
        <label>
          Raza days required in the year
          <input
            type="number"
            min="0"
            value={values.razaDays}
            disabled={!editable}
            onChange={(event) => patch({ razaDays: event.target.value })}
          />
          {errors.razaDays ? <span className="field-error">{errors.razaDays}</span> : null}
        </label>
        <PillGroup
          label="Likely exam months"
          items={MONTHS}
          values={values.examMonths}
          disabled={!editable}
          onToggle={(month) => toggleArray('examMonths', month)}
        />
        {errors.examMonths ? <span className="field-error">{errors.examMonths}</span> : null}
        <p className="muted">Do the exam dates clash with any Miqaat or Jamea event?</p>
        <div className="split-choice">
          {[true, false].map((answer) => (
            <button
              className={`choice-card ${values.clashWithMiqaat === answer ? 'selected' : ''}`}
              type="button"
              disabled={!editable}
              onClick={() => patch({ clashWithMiqaat: answer, clashEvents: answer ? values.clashEvents : [] })}
              key={String(answer)}
            >
              {answer ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
        {errors.clashWithMiqaat ? <span className="field-error">{errors.clashWithMiqaat}</span> : null}
        {values.clashWithMiqaat ? (
          <>
            <PillGroup
              label="Clash events"
              items={MIQAAT_EVENTS}
              values={values.clashEvents}
              disabled={!editable}
              danger
              onToggle={(eventName) => toggleArray('clashEvents', eventName)}
            />
            {errors.clashEvents ? <span className="field-error">{errors.clashEvents}</span> : null}
            <label>
              Clash details
              <textarea
                value={values.clashDetails}
                disabled={!editable}
                onChange={(event) => patch({ clashDetails: event.target.value })}
              />
            </label>
          </>
        ) : null}
        <label>
          Additional notes for Idara
          <textarea
            value={values.additionalNotes}
            disabled={!editable}
            onChange={(event) => patch({ additionalNotes: event.target.value })}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="form-section">
      <h2>Review</h2>
      <div className="review-list">
        {[
          ['TR Number', values.trNo],
          ['Full Name', values.fullName],
          ['Qualifications', values.qualifications.join(', ')],
          ['Other Qualification', values.otherQual],
          ['Pursuing Next Qualification', values.hasThoughtAboutNext ? 'Yes' : 'No'],
          ['Stage', stageLabels[values.stage]],
          ['Requires Idara Assistance', values.requiresAssistance === null ? '' : values.requiresAssistance ? 'Yes' : 'No'],
          ['Degree / Programme', values.degreeApplying],
          ['Institution', values.institution],
          ['Study Commitment', values.studyCommitment],
          ['Raza Days', values.razaDays ? `${values.razaDays} days` : ''],
          ['Exam Months', values.examMonths.join(', ')],
          ['Miqaat / Jamea Clash', values.clashWithMiqaat ? 'Yes' : 'No'],
          ['Clash Events', values.clashEvents.join(', ')],
          ['Clash Details', values.clashDetails],
          ['Additional Notes', values.additionalNotes],
        ]
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div className="review-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
      </div>
      <div className="notice warning">After submission, status is pending until reviewed by the Idara.</div>
    </div>
  );
}

function PillGroup({ label, items, values, disabled, danger = false, onToggle }) {
  return (
    <div className="pill-section">
      <span>{label}</span>
      <div className="pill-grid">
        {items.map((item) => (
          <button
            className={`pill ${danger ? 'danger-pill' : ''} ${values.includes(item) ? 'selected' : ''}`}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
