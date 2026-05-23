import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { linkStudentProfile } from '../services/firestore';
import { profileSchema } from '../utils/validation';

export function ProfileLink({ onLinked }) {
  const { user, refreshProfile } = useAuth();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { trNo: '', fullName: user?.displayName || '' },
  });

  async function onSubmit(values) {
    setSaving(true);
    setError('');
    try {
      await linkStudentProfile(user, values);
      await refreshProfile();
      onLinked();
    } catch (err) {
      setError(err.message || 'Unable to link this profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <main className="center-layout">
        <form className="panel narrow fade-up" onSubmit={handleSubmit(onSubmit)}>
          <p className="eyebrow">Google account linked</p>
          <h1>Welcome</h1>
          <p className="muted">
            Enter your TR number and full name once. This links your Google account to one student record.
          </p>
          <label>
            TR Number
            <input {...register('trNo')} placeholder="TR1234" autoComplete="off" />
            {errors.trNo ? <span className="field-error">{errors.trNo.message}</span> : null}
          </label>
          <label>
            Full Name
            <input {...register('fullName')} placeholder="Your full name" autoComplete="name" />
            {errors.fullName ? <span className="field-error">{errors.fullName.message}</span> : null}
          </label>
          <label>
            Google Email
            <input value={user.email} readOnly />
          </label>
          {error ? <div className="notice danger">{error}</div> : null}
          <button className="gold-button full" type="submit" disabled={saving}>
            {saving ? 'Linking...' : 'Save and Continue'}
          </button>
        </form>
      </main>
    </AppShell>
  );
}
