import { Lock, FileText } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';

export function StatusLanding({ record, values, stageLabels, onOpenRegistration }) {
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
    <section className={`status-landing panel ${approved ? 'approved' : onHold ? 'on-hold' : pending ? 'pending' : ''}`}>
      <div className="status-hero">
        <div className="status-copy">
          <p className="eyebrow">Raza Status</p>
          <h2>{statusTitle}</h2>
          <p>
            {approved
              ? 'This is a preliminary raza with regard to your programme. Final raza to attend examinations will be on JHS.'
              : onHold
                ? 'The Idara needs clarification before continuing the review. Please read the note, update your registration, and resubmit.'
                : pending
                  ? 'Your details are recorded and waiting for Idara review. Please visit the Idara if you are close to examinations.'
                  : 'Begin the registration so the Idara can review your further-studies details.'}
          </p>
        </div>
        <StatusBadge status={record?.status || 'not submitted'} />
      </div>

      {record?.adminNotes ? (
        <div className="admin-note">
          <span>Notes from Idara</span>
          <p>{record.adminNotes}</p>
        </div>
      ) : null}

      <div className="status-summary-grid">
        <SummaryTile label="TR Number" value={values.trNo} />
        <SummaryTile label="Student" value={values.fullName} />
        <SummaryTile label="Programme" value={values.degreeApplying || 'Not provided'} />
        <SummaryTile label="Stage" value={stageLabels[values.stage] || 'Not selected'} />
      </div>

      <div className="status-actions">
        {approved ? (
          <div className="notice success">
            <Lock size={16} />
            Your approved registration is locked. You can view the submitted details in the registration tab.
          </div>
        ) : onHold ? (
          <button className="gold-button" type="button" onClick={onOpenRegistration}>
            <FileText size={16} />
            Update and Resubmit
          </button>
        ) : (
          <button className={pending ? 'outline-button' : 'gold-button'} type="button" onClick={onOpenRegistration}>
            <FileText size={16} />
            {pending ? 'View Submitted Registration' : 'Start Registration'}
          </button>
        )}
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
