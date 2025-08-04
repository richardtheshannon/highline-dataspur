// src/app/dashboard/layout.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, Briefcase, Users, FileText, Settings, LogOut } from "lucide-react";
import { LayoutPreferenceProvider, useLayoutPreference } from '@/lib/hooks/use-layout-preference';
import { cn } from "@/lib/utils";

// This component contains the logic for the sidebar's contents
function SidebarItems() {
  const pathname = usePathname();
  const { open, setOpen, isMobile } = useSidebar();
  const { preference } = useLayoutPreference();

  const handleNavigation = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Briefcase, label: "Projects", href: "/dashboard/projects" },
    { icon: Users, label: "Team", href: "/dashboard/team" },
    { icon: FileText, label: "Documents", href: "/dashboard/documents" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <>
      <SidebarHeader>
        <div className={cn(
          "flex",
          preference === 'right-handed' ? "justify-end" : "justify-center"
        )}>
          {open && (
            <Link href="/dashboard">
              <Image
                src="/media/icon-96x96.png"
                alt="Company Logo"
                width={48}
                height={48}
                priority
              />
            </Link>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {/* This container now aligns all its children to the right */}
          <SidebarGroupContent className={cn(
            preference === 'right-handed' && 'items-end'
          )}>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  onClick={handleNavigation}
                >
                  {/* The link itself just needs to reverse its content */}
                  <Link href={item.href} className={cn(
                    "flex items-center gap-2",
                    preference === 'right-handed' && "flex-row-reverse"
                  )}>
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {open && <span className="truncate">{item.label}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuItem>
          {/* A wrapper div is used to align the single footer item */}
          <div className={cn(preference === 'right-handed' && 'flex justify-end')}>
            <SidebarMenuButton onClick={() => signOut()} className={cn(
              "flex items-center gap-2",
              preference === 'right-handed' && "flex-row-reverse"
            )}>
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {open && <span>Logout</span>}
            </SidebarMenuButton>
          </div>
        </SidebarMenuItem>
      </SidebarFooter>
    </>
  );
}

// This component arranges the main UI based on preference
function DashboardUI({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const { preference } = useLayoutPreference();

    return (
        <div className={cn(
            "flex h-screen w-full",
            preference === 'right-handed' && 'flex-row-reverse'
        )}>
            <Sidebar>
                <SidebarItems />
            </Sidebar>
            <div className="flex-1 flex flex-col min-w-0">
                <header className={cn(
                  "border-b px-4 py-3 flex items-center gap-4",
                  preference === 'right-handed' && 'flex-row-reverse'
                )}>
                    <SidebarTrigger />
                    <h1 className="text-xl font-semibold">
                        {session?.user?.name || session?.user?.email}
                    </h1>
                </header>
                <main className="flex-1 overflow-auto">
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

// The main layout component wraps everything in the providers
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <LayoutPreferenceProvider>
      <SidebarProvider>
        <DashboardUI>
          {children}
        </DashboardUI>
      </SidebarProvider>
    </LayoutPreferenceProvider>
  );
}
