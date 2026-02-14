import React from 'react';

export default function ExceptionBanner({ message }) {
  if (!message) return null;
  return (
    <div className="w-full left-0 right-0 bg-[#D4AF37] text-white py-2 px-4 flex items-center overflow-hidden" style={{ position: 'relative' }}>
      <marquee behavior="scroll" direction="left" scrollamount="5" className="text-base font-semibold">
        {message}
      </marquee>
    </div>
  );
}
