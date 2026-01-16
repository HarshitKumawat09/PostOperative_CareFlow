import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link href="/" className="flex items-center justify-center" prefetch={false}>
        <Logo className="h-6 w-6 text-primary" />
        <span className="ml-2 text-lg font-semibold font-headline">CareFlow</span>
      </Link>
      <nav className="ml-auto flex items-center gap-4 sm:gap-6">
        <Button asChild>
            <Link href="/login" prefetch={false}>
              Login
            </Link>
        </Button>
      </nav>
    </header>
  );
}
