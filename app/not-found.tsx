import Link from 'next/link';
import { btnClass } from '@/lib/utils';


export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-5 text-center">
      <p className="font-display text-7xl font-bold text-pine-200">404</p>
      <h1 className="font-display text-2xl font-bold">We could not find that page</h1>
      <Link href="/" className={btnClass('primary', 'md', 'mt-2')}>Go to home</Link>
    </main>
  );
}
