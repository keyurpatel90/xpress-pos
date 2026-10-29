import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage({ searchParams }: { searchParams: { next?: string; verified?: string; error?: string } }) {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your restaurant"
      footer={<>New to Xpress POS? <Link href="/signup" className="font-semibold text-brand-700 hover:underline">Start your free trial</Link></>}>
      <LoginForm next={searchParams.next} verified={searchParams.verified === '1'} error={searchParams.error} />
    </AuthShell>
  );
}
