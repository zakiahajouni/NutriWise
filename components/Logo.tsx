'use client'

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Image - Sized to fit navbar height (h-16 = 64px) */}
      <img
        src="/nutriwise-logo.png"
        alt="NutriWise Logo"
        className="h-32 md:h-36 w-auto object-contain"
        style={{ maxHeight: '144px', display: 'block' }}
      />
    </div>
  )
}
