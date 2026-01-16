'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/patient/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/patient/logs', icon: FileText, label: 'My Logs' },
  { href: '/patient/profile', icon: User, label: 'Profile' },
];

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, auth, isUserLoading } = useFirebase();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const UserAvatar = () => {
    if (isUserLoading) return <Skeleton className="h-8 w-8 rounded-full" />;
    if (!user) return <AvatarFallback>?</AvatarFallback>;
    
    return (
        <>
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
            <AvatarFallback>{user.displayName ? user.displayName.charAt(0) : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
        </>
    );
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="w-7 h-7 text-primary" />
            <span className="text-lg font-semibold font-headline">CareFlow</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                 <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenuButton onClick={handleLogout}>
                <LogOut />
                <span>Logout</span>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Can add breadcrumbs or page title here */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Avatar className="h-6 w-6">
                    <UserAvatar />
                </Avatar>
                <span className="hidden sm:inline">
                    {isUserLoading ? 'Loading...' : user?.displayName || user?.email}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/patient/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
               <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
