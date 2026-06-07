import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, FileText, Loader2, Lock, Save, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { StatusBadge } from '../StatusBadge';
import {
  MIQAAT_EVENTS,
  MONTHS,
  NEXT_QUALIFICATION_OPTIONS,
  STAGES,
  STUDENT_STEPS,
} from '../../data/constants';
import { isAutoApprovedRegistration, nextQualificationLabel } from '../../utils/registration';
import { getExamProof, saveExamProofNotGenerated, uploadExamProof } from '../../services/firestore';
import { PROOF_IMAGE_ACCEPT, describeProofImageRules, examProofStateLabel, isProofImageFile } from '../../utils/proofUpload';

export function RegistrationTab({
  editable,
  errors,
  examProof,
  message,
  record,
  saving,
  stageLabels,
  step,
  values,
  nextStep,
  patch,
  prevStep,
  submit,
  toggleArray,
  user,
  onExamProofChange,
}) {
  if (!editable) {
    const approved = record?.status === 'approved';
    const pending = record?.status === 'pending';

    return (
      <section className="panel read-only approved-summary-panel">
        <div className="section-heading">
          <p className="eyebrow">{approved ? 'Approved Registration' : 'Student Registration'}</p>
          <h2>{approved ? 'Submitted Details' : 'Under Review'}</h2>
          <p>
            {approved
              ? 'Your registration has been approved by the Idara and is now read-only.'
              : 'Your registration is pending Idara review. If clarification is needed, this page will reopen for edits.'}
          </p>
        </div>
        <StatusPanel record={record} values={values} stageLabels={stageLabels} examProof={examProof} />
        <div className={`notice ${approved ? 'success' : 'warning'}`}>
          <Lock size={16} /> {approved ? 'Approved records cannot be edited from the student portal.' : 'Pending records are locked while the Idara reviews them.'}
        </div>
        <RegistrationSummary values={values} stageLabels={stageLabels} examProof={examProof} />
        {pending && record?.adminNotes ? (
          <div className="admin-note standalone">
            <span>Notes from Idara</span>
            <p>{record.adminNotes}</p>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <>
      <StatusPanel record={record} values={values} stageLabels={stageLabels} examProof={examProof} />
      <div className="section-heading registration-heading">
        <p className="eyebrow">{record?.status === 'on-hold' ? 'Clarification Needed' : 'Student Registration'}</p>
        <h2>{record?.status === 'on-hold' ? 'Update and Resubmit' : 'Further Studies Registration'}</h2>
        <p>
          {record?.status === 'on-hold'
            ? 'Please update the requested details and resubmit so the Idara can continue the review.'
            : 'Complete each section carefully. Your draft is saved locally on this device.'}
        </p>
      </div>
      {record?.status === 'on-hold' && record?.adminNotes ? (
        <div className="notice warning registration-note">
          <FileText size={16} />
          {record.adminNotes}
        </div>
      ) : null}
      <Stepper step={step} />
      <section className="panel">
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
              examProof={examProof}
              stageLabels={stageLabels}
              editable={editable}
              patch={patch}
              toggleArray={toggleArray}
              user={user}
              onExamProofChange={onExamProofChange}
            />
          </motion.div>
        </AnimatePresence>
        {message ? <div className={`notice ${message.includes('Unable') ? 'danger' : 'success'}`}>{message}</div> : null}
        <div className="form-actions">
          <button className="outline-button" type="button" onClick={prevStep} disabled={step === 0}>
            Back
          </button>
        {step < STUDENT_STEPS.length - 1 ? (
            <button className="gold-button" type="button" onClick={nextStep}>
              Continue
            </button>
          ) : (
            <button className="gold-button" type="button" onClick={submit} disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : record?.status === 'on-hold' ? 'Resubmit Updates' : 'Submit Registration'}
            </button>
          )}
        </div>
      </section>
    </>
  );
}

function StatusPanel({ record, values, stageLabels, examProof }) {
  const approved = record?.status === 'approved';
  const onHold = record?.status === 'on-hold';
  const pending = record?.status === 'pending';
  const statusTitle = approved
    ? 'Approved'
    : onHold
      ? 'On Hold'
      : pending
        ? 'Pending Review'
        : 'Registration Not Submitted';

  return (
    <section className={`status-panel inline-status ${approved ? 'approved' : onHold ? 'on-hold' : pending ? 'pending' : ''}`}>
      <div className="status-copy">
        <p className="eyebrow">Submission Status</p>
        <h2>{statusTitle}</h2>
        <p>
          {approved
            ? 'Your registration has been approved by the Idara and is now read-only.'
            : onHold
              ? 'The Idara needs clarification before continuing the review. Please read the note, update your registration, and resubmit.'
              : pending
                ? 'Your details are recorded and waiting for Idara review.'
                : 'Complete the registration so the Idara can review your further-studies details.'}
        </p>
      </div>
      <StatusBadge status={record?.status || 'not submitted'} />
      {record?.adminNotes ? (
        <div className="admin-note">
          <span>Notes from Idara</span>
          <p>{record.adminNotes}</p>
        </div>
      ) : null}
      <div className="status-summary-grid embedded">
        <SummaryTile label="Programme" value={values.degreeApplying || 'Not provided'} />
        <SummaryTile label="Stage" value={stageLabels[values.stage] || 'Not selected'} />
        <SummaryTile label="Exam Proof" value={examProofStateLabel(examProof?.state)} />
      </div>
    </section>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div className="summary-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RegistrationSummary({ values, stageLabels, examProof }) {
  const rows = [
    ['TR Number', values.trNo],
    ['Full Name', values.fullName],
    ['Next Qualification', nextQualificationLabel(values)],
    ['Stage', stageLabels[values.stage]],
    ['Leaves Needed This Year', values.needsLeavesThisYear === null ? '' : values.needsLeavesThisYear ? 'Yes' : 'No'],
    ['Requires Idara Assistance', values.requiresAssistance === null ? '' : values.requiresAssistance ? 'Yes' : 'No'],
    ['Degree / Programme', values.degreeApplying],
    ['Institution', values.institution],
    ['Study Commitment', values.studyCommitment],
    ['Raza Days', values.razaDays ? `${values.razaDays} days` : ''],
    ['Exam Months', values.examMonths.join(', ')],
    ['Miqaat / Jamea Clash', values.clashWithMiqaat ? 'Yes' : 'No'],
    ['Clash Events', values.clashEvents.join(', ')],
    ['Clash Details', values.clashDetails],
    ['Exam Proof', examProofStateLabel(examProof?.state)],
    ['Additional Notes', values.additionalNotes],
  ].filter(([, value]) => value);

  return (
    <div className="review-list summary-list">
      {rows.map(([label, value]) => (
        <div className="review-row" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
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

function StepContent({ step, values, errors, examProof, stageLabels, editable, patch, toggleArray, user, onExamProofChange }) {
  const selectedNextQualification =
    values.nextQualificationIntent ||
    (values.hasThoughtAboutNext === true ? 'planning' : values.hasThoughtAboutNext === false ? 'not_now' : '');

  if (step === 0) {
    return (
      <div className="form-section">
        <h2>Confirm Identity</h2>
        <div className="identity-summary compact">
          <div>
            <span>TR Number</span>
            <strong>{values.trNo}</strong>
          </div>
          <div>
            <span>Full Name</span>
            <strong>{values.fullName}</strong>
          </div>
        </div>
        <p className="muted">
          This TR number is derived from your official education email and cannot be edited here.
        </p>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="form-section">
        <h2>Next Qualification</h2>
        <p className="muted">What is your current plan for further qualification?</p>
        <div className="stack">
          {NEXT_QUALIFICATION_OPTIONS.map((option) => (
            <button
              className={`choice-card left ${selectedNextQualification === option.value ? 'selected' : ''}`}
              type="button"
              disabled={!editable}
              onClick={() =>
                patch({
                  nextQualificationIntent: option.value,
                  hasThoughtAboutNext: option.continuesWorkflow,
                  stage: option.value === 'planning' ? values.stage : '',
                  needsLeavesThisYear: option.value === 'already_pursuing' ? values.needsLeavesThisYear : null,
                  requiresAssistance: option.value === 'not_now' ? values.requiresAssistance : null,
                })
              }
              key={option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.hasThoughtAboutNext ? <span className="field-error">{errors.hasThoughtAboutNext}</span> : null}
        {values.nextQualificationIntent === 'planning' || (!values.nextQualificationIntent && values.hasThoughtAboutNext === true) ? (
          <div className="sub-question">
            <div className="sub-question-header">
              <span>Next Steps</span>
              <p>Select the option that best describes what you need from Idara.</p>
            </div>
            <div className="stack">
              {STAGES.map((stage) => (
                <button
                  className={`choice-card left sub-choice ${values.stage === stage.value ? 'selected' : ''}`}
                  type="button"
                  disabled={!editable}
                  onClick={() => patch({ stage: stage.value })}
                  key={stage.value}
                >
                  {stage.label}
                </button>
              ))}
            </div>
            {errors.stage ? <span className="field-error">{errors.stage}</span> : null}
          </div>
        ) : null}
        {values.nextQualificationIntent === 'not_now' || (!values.nextQualificationIntent && values.hasThoughtAboutNext === false) ? (
          <div className="sub-question">
            <div className="sub-question-header">
              <span>Assistance</span>
              <p>Tell us whether you still need guidance at this stage.</p>
            </div>
            <div className="split-choice">
              {[true, false].map((answer) => (
                <button
                  className={`choice-card sub-choice ${values.requiresAssistance === answer ? 'selected' : ''}`}
                  type="button"
                  disabled={!editable}
                  onClick={() => patch({ requiresAssistance: answer })}
                  key={String(answer)}
                >
                  {answer ? 'Idara help needed' : 'No assistance needed'}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {errors.requiresAssistance ? <span className="field-error">{errors.requiresAssistance}</span> : null}
      </div>
    );
  }

  if (step === 2) {
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
        {values.nextQualificationIntent === 'already_pursuing' ? (
          <div className="sub-question">
            <div className="sub-question-header">
              <span>Leaves</span>
              <p>Select whether your current course needs leave support from Idara this academic year.</p>
            </div>
            <div className="split-choice">
              {[true, false].map((answer) => (
                <button
                  className={`choice-card sub-choice ${values.needsLeavesThisYear === answer ? 'selected' : ''}`}
                  type="button"
                  disabled={!editable}
                  onClick={() => patch({ needsLeavesThisYear: answer })}
                  key={String(answer)}
                >
                  {answer ? 'Need leaves during this academic year' : 'No additional leaves needed this year'}
                </button>
              ))}
            </div>
            {errors.needsLeavesThisYear ? <span className="field-error">{errors.needsLeavesThisYear}</span> : null}
          </div>
        ) : null}
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
        <ExamProofPanel
          editable={editable}
          examProof={examProof}
          user={user}
          isAlreadyPursuing={values.nextQualificationIntent === 'already_pursuing'}
          onExamProofChange={onExamProofChange}
        />
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
          ['Next Qualification', nextQualificationLabel(values)],
          ['Stage', stageLabels[values.stage]],
          ['Leaves Needed This Year', values.needsLeavesThisYear === null ? '' : values.needsLeavesThisYear ? 'Yes' : 'No'],
          ['Requires Idara Assistance', values.requiresAssistance === null ? '' : values.requiresAssistance ? 'Yes' : 'No'],
          ['Degree / Programme', values.degreeApplying],
          ['Institution', values.institution],
          ['Study Commitment', values.studyCommitment],
          ['Raza Days', values.razaDays ? `${values.razaDays} days` : ''],
          ['Exam Months', values.examMonths.join(', ')],
          ['Miqaat / Jamea Clash', values.clashWithMiqaat ? 'Yes' : 'No'],
          ['Clash Events', values.clashEvents.join(', ')],
          ['Clash Details', values.clashDetails],
          ['Exam Proof', examProofStateLabel(examProof?.state)],
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
      {isAutoApprovedRegistration(values) ? (
        <div className="notice success">This response is eligible for automatic approval because no Idara assistance or leave support is needed.</div>
      ) : (
        <div className="notice warning">After submission, status is pending until reviewed by the Idara.</div>
      )}
    </div>
  );
}

function ExamProofPanel({ editable, examProof, user, isAlreadyPursuing, onExamProofChange }) {
  const fileInputRef = useRef(null);
  const [proofFile, setProofFile] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const proofUploaded = examProof?.state === 'uploaded';

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) {
      setProofFile(null);
      return;
    }

    if (!isProofImageFile(selectedFile)) {
      setError('Upload a JPG, JPEG, or PNG image smaller than 2 MB.');
      event.target.value = '';
      setProofFile(null);
      return;
    }

    setProofFile(selectedFile);
    setError('');
    setMessage('');
  }

  async function uploadSelectedProof() {
    if (!proofFile) {
      setError('Please choose a hall ticket image first.');
      return;
    }

    setPhase('uploading');
    setError('');
    setMessage('');
    try {
      const nextProof = await uploadExamProof(user.uid, proofFile);
      onExamProofChange(nextProof);
      setProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setMessage('Hall ticket proof uploaded.');
    } catch (err) {
      setError(err.message || 'Unable to upload hall ticket.');
    } finally {
      setPhase('idle');
    }
  }

  async function markNotGenerated() {
    setPhase('saving');
    setError('');
    setMessage('');
    try {
      await saveExamProofNotGenerated(user.uid);
      onExamProofChange(await getExamProof(user.uid));
      setMessage('Hall ticket marked as not generated yet.');
    } catch (err) {
      setError(err.message || 'Unable to save hall ticket state.');
    } finally {
      setPhase('idle');
    }
  }

  return (
    <div className="exam-proof-panel">
      <div className="sub-question-header">
        <span>{isAlreadyPursuing ? 'Hall Ticket' : 'Exam Confirmation'}</span>
        <p>Upload a Hall Ticket to confirm your exam when it is available.</p>
      </div>

      <div className="proof-status-row">
        <StatusBadge status={proofUploaded ? 'approved' : examProof?.state === 'not_generated_yet' ? 'pending' : 'not submitted'} />
        <strong>{examProofStateLabel(examProof?.state)}</strong>
        {proofUploaded ? (
          <a href={examProof.proofPreviewUrl || examProof.proofUrl} target="_blank" rel="noreferrer">
            Open hall ticket
          </a>
        ) : null}
      </div>

      {editable ? (
        <>
          <label>
            Hall Ticket Image
            <input ref={fileInputRef} type="file" accept={PROOF_IMAGE_ACCEPT} onChange={handleFileChange} />
            <span className="field-hint">{describeProofImageRules()}</span>
          </label>
          {proofFile ? (
            <div className="file-chip">
              <Upload size={15} />
              <span>{proofFile.name}</span>
            </div>
          ) : null}
          <div className="exam-proof-actions">
            <button className="gold-button" type="button" onClick={uploadSelectedProof} disabled={phase !== 'idle'}>
              {phase === 'uploading' ? <Loader2 size={16} className="spin-icon" /> : <Upload size={16} />}
              {phase === 'uploading' ? 'Uploading...' : proofUploaded ? 'Replace Upload' : 'Upload Hall Ticket'}
            </button>
            <button className="outline-button" type="button" onClick={markNotGenerated} disabled={phase !== 'idle'}>
              {phase === 'saving' ? 'Saving...' : 'Not generated yet'}
            </button>
          </div>
        </>
      ) : null}

      {error ? <div className="notice danger">{error}</div> : null}
      {message ? <div className="notice success">{message}</div> : null}
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
