import Link from "next/link";
import { Logo } from "@/components/icons/logo";

export function Footer() {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
      <div className="flex items-center gap-2">
        <Logo className="w-5 h-5 text-primary" />
        <p className="text-xs text-muted-foreground">&copy; 2024 CareFlow. All rights reserved.</p>
      </div>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6">
        <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
          Terms of Service
        </Link>
        <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
          Privacy Policy
        </Link>
      </nav>
    </footer>
  );
}
