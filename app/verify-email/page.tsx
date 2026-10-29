import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { ResendButton } from '@/components/auth/ResendButton';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = { title: 'Verify your email' };

export default function VerifyEmailPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams.email ?? '';
  return (
    <AuthShell title="Check your email"
      subtitle={email ? `We sent a verification link to ${email}.` : 'We sent you a verification link.'}
      footer={<>Already verified? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link></>}>
      <div className="space-y-5">
        <div className="flex gap-3 rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
          <Icon name="mail" className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Open the email and tap the link to confirm your address. You can sign in as soon as it is verified. If you do not see it, check your spam folder.</p>
        </div>
        <ResendButton email={email} />
      </div>
    </AuthShell>
  );
}
