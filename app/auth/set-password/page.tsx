import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { SetPasswordForm } from '@/components/auth/SetPasswordForm';

export const metadata: Metadata = { title: 'Choose a password' };

export default function SetPasswordPage() {
  return (
    <AuthShell title="Choose a password" subtitle="You will use this to sign in from now on.">
      <SetPasswordForm />
    </AuthShell>
  );
}
