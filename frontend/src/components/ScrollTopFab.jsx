import { useEffect, useState } from 'react';

export default function ScrollTopFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const canScroll = docHeight > (window.innerHeight + 120);
      setVisible(canScroll && window.scrollY >= window.innerHeight);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-4 z-40 inline-flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-white/95 text-[#1A1A1A] shadow-[0_14px_35px_rgba(30,24,18,0.2)] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#D4AF37] hover:text-[#B8891F]"
      aria-label="Remonter en haut de la page"
      title="Remonter en haut"
    >
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 12.5L10 7.5L15 12.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
