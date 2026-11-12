'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';

const videos = [
  {
    src: '/videos/gemini_generated_video_ecb39eb4.mp4',
    title: 'Xpress POS in action',
    description: 'See how Xpress POS helps your team move through service with confidence.',
  },
  {
    src: '/videos/gemini_generated_video_6b5c3d3b.mp4',
    title: 'A smoother restaurant service',
    description: 'Explore another look at how your restaurant team can stay in sync with Xpress POS.',
  },
];

export function VideoShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeVideo = videos[activeIndex];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(([entry]) => {
      const video = videoRef.current;
      if (!video) return;
      if (entry.isIntersecting) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    }, { threshold: 0.35 });

    observer.observe(section);
    return () => observer.disconnect();
  }, [activeIndex]);

  const showVideo = (direction: -1 | 1) => {
    setActiveIndex((index) => (index + direction + videos.length) % videos.length);
  };

  return (
    <section ref={sectionRef} aria-label="Product videos" className="bg-slate-950 py-14 text-white sm:py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 md:grid-cols-[0.72fr_1.28fr] md:gap-12">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-300">A closer look</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-4xl">See your team in sync</h2>
          <p className="mt-4 max-w-md text-slate-300">{activeVideo.description}</p>
          {videos.length > 1 && (
            <div className="mt-6 flex items-center gap-3" aria-label="Video carousel controls">
              <button type="button" onClick={() => showVideo(-1)} aria-label="Previous video" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition hover:bg-white/10 focus-visible:outline-white">
                <Icon name="chev" className="h-4 w-4 rotate-90" />
              </button>
              <span className="text-sm text-slate-300" aria-live="polite">{activeIndex + 1} / {videos.length}</span>
              <button type="button" onClick={() => showVideo(1)} aria-label="Next video" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition hover:bg-white/10 focus-visible:outline-white">
                <Icon name="chev" className="h-4 w-4 -rotate-90" />
              </button>
            </div>
          )}
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
          <video
            key={activeVideo.src}
            ref={videoRef}
            className="aspect-video w-full object-contain"
            src={activeVideo.src}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={activeVideo.title}
          />
        </div>
      </div>
    </section>
  );
}
