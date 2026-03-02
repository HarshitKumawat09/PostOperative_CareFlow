import Link from 'next/link';
import { ShieldCheck, ArrowLeft, HeartPulse } from 'lucide-react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  // 👇 PASTE YOUR COPIED iSTOCK IMAGE URL HERE 👇
  // Example: 'https://media.istockphoto.com/id/123456789/photo/modern-hospital-room...'
  const MY_ISTOCK_IMAGE_URL = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop'; 

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-[1.1fr_1fr] bg-white">
      {/* ========================================== */}
      {/* LEFT PANEL: Image and Branding             */}
      {/* ========================================== */}
      <div className="relative hidden h-full flex-col p-10 text-white lg:flex overflow-hidden">
        
        {/* 1. Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: `url('${MY_ISTOCK_IMAGE_URL}')` }}
        />
        
        {/* 2. Overlays (As requested: Dark Blue ~60% + Slate-900 Gradient) */}
        {/* The gradient ensures text at the top and bottom is always readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-transparent to-slate-900/90 z-0" />
        {/* The dark blue multiply layer gives the whole image that rich, clinical blue tint at ~60% opacity */}
        <div className="absolute inset-0 bg-[#0a192f]/60 mix-blend-multiply z-0" />

        {/* Top: Logo and Back Link */}
        <div className="relative z-20 flex items-center">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="rounded-full border-2 border-white/80 p-1 backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-wide">CareFlow</span>
          </Link>
        </div>

        {/* Middle: Hero Content */}
        <div className="relative z-20 mt-32 max-w-lg">
          
          {/* Circular Heartbeat Graphic */}
          <div className="mb-8 relative inline-flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-cyan-400/80 bg-[#0a192f]/80 shadow-lg backdrop-blur-md">
            <HeartPulse className="h-8 w-8 text-[#f4ebd8]" strokeWidth={2.5} />
            {/* Small cyan accent dot on the ring */}
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-cyan-400 border-2 border-[#0a192f]"></div>
          </div>
          
          {/* Heading - Warm cream color to match the reference image */}
          <h1 className="text-[3rem] font-bold leading-[1.15] text-[#f4ebd8] tracking-tight drop-shadow-sm">
            Your recovery journey, <br />
            simplified.
          </h1>
          
          {/* Subheading */}
          <p className="mt-5 text-[1.05rem] text-slate-200 max-w-[400px] leading-relaxed drop-shadow-sm">
            Securely connect with your care team and stay on track with your post-operative plan.
          </p>
        </div>

        {/* Bottom: Trust Badges */}
        <div className="relative z-20 mt-auto">
          <p className="mb-3 text-xs font-semibold text-slate-300/70 uppercase tracking-widest">Trust Badges</p>
          
          {/* HIPAA Badge - Green Glassmorphism */}
          <div className="flex max-w-[450px] items-center gap-4 rounded-xl border border-emerald-500/30 bg-emerald-900/30 p-4 backdrop-blur-md shadow-2xl">
            <div className="rounded-full bg-emerald-500/20 p-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-300">HIPAA Compliant</p>
              <p className="text-sm text-emerald-100/80">Your data is always private and secure.</p>
            </div>
          </div>
        </div>

        {/* Bottom Left 'N' Logo (From your image reference) */}
        <div className="absolute bottom-6 left-6 z-20">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111] text-xs font-bold text-white shadow-md border border-white/10">
              N
            </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* RIGHT PANEL: Form Container                */}
      {/* ========================================== */}
      <div className="relative flex min-h-screen w-full items-center justify-center bg-slate-50/80 px-6 py-12 lg:px-12">
        <div className="z-10 w-full max-w-[420px]">
          {children}
        </div>
      </div>
      
    </div>
  );
}