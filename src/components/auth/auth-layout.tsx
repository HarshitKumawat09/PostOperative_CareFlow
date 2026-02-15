import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { placeholderImages } from '@/lib/data';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const authImage = placeholderImages.find(p => p.id === 'auth-background');

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url(${authImage?.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-primary/80" />

        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-xl font-headline">CareFlow</span>
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold font-headline">Your recovery journey, simplified.</h2>
            <p className="text-primary-foreground/80">
              Securely connect with your care team and stay on track with your post-operative plan.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-green-400/20 bg-green-500/10 p-4 text-sm">
            <ShieldCheck className="h-8 w-8 text-green-400" />
            <div>
              <p className="font-semibold text-green-300">HIPAA Compliant</p>
              <p className="text-green-300/80">Your data is always private and secure.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center py-12 bg-background">
        <div className="mx-auto grid w-[350px] gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}
