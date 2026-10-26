import { notFound } from 'next/navigation';
import { LEGAL } from '@/lib/site';

export function generateStaticParams() {
  return Object.keys(LEGAL).map((doc) => ({ doc }));
}

export function generateMetadata({ params }: { params: { doc: string } }) {
  return { title: LEGAL[params.doc]?.title ?? 'Legal' };
}

export default function LegalPage({ params }: { params: { doc: string } }) {
  const d = LEGAL[params.doc];
  if (!d) notFound();
  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="font-display text-4xl font-bold tracking-tight">{d.title}</h1>
      <div className="mt-6 space-y-4 text-ink-soft">{d.body.map((p) => <p key={p}>{p}</p>)}</div>
    </div>
  );
}
