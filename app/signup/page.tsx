import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = { title: 'Start your free trial' };

export default function SignupPage() {
  return (
    <AuthShell title="Start your free trial" subtitle="Set up your restaurant in a few minutes. No card needed."
      footer={<>Already have an account? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link></>}>
      <SignupForm />
    </AuthShell>
  );
}
