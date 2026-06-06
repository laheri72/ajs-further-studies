import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, FileText, Lock, Save } from 'lucide-react';
import {
  MIQAAT_EVENTS,
  MONTHS,
  NEXT_QUALIFICATION_OPTIONS,
  QUALIFICATIONS,
  STAGES,
  STUDENT_STEPS,
} from '../../data/constants';
import { isAutoApprovedRegistration, nextQualificationLabel } from '../../utils/registration';

export function RegistrationTab({
  editable,
  errors,
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
        <div className={`notice ${approved ? 'success' : 'warning'}`}>
          <Lock size={16} /> {approved ? 'Approved records cannot be edited from the student portal.' : 'Pending records are locked while the Idara reviews them.'}
        </div>
        <RegistrationSummary values={values} stageLabels={stageLabels} />
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

function RegistrationSummary({ values, stageLabels }) {
  const rows = [
    ['TR Number', values.trNo],
    ['Full Name', values.fullName],
    ['Qualifications', values.qualifications.join(', ')],
    ['Other Qualification', values.otherQual],
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

function StepContent({ step, values, errors, stageLabels, editable, patch, toggleArray }) {
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
