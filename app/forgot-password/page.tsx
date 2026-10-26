import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { ForgotForm } from '@/components/auth/ForgotForm';

export const metadata: Metadata = { title: 'Reset password' };

export default function ForgotPage() {
  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we will send you a link."
      footer={<Link href="/login" className="font-semibold text-pine-700 hover:underline">Back to sign in</Link>}>
      <ForgotForm />
    </AuthShell>
  );
}
