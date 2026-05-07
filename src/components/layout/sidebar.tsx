'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  CreditCard,
  BarChart3,
  FileText,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const adminLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/employees', label: 'Employees', icon: Users },
  { href: '/dashboard/programs', label: 'Programs', icon: GraduationCap },
  { href: '/dashboard/participants', label: 'Participants', icon: UserCheck },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const employeeLinks = [
  { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/programs', label: 'My Programs', icon: GraduationCap },
  { href: '/employee/participants', label: 'Participants', icon: UserCheck },
  { href: '/employee/payments', label: 'Payments', icon: CreditCard },
  { href: '/employee/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  variant?: 'admin' | 'employee';
}

export function Sidebar({ variant = 'admin' }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { user, signOut } = useAuth();
  const unreadCount = useAppStore((s) => s.unreadCount());
  const links = variant === 'admin' ? adminLinks : employeeLinks;

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 h-screen z-40 flex flex-col border-r border-sidebar-border bg-sidebar"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary glow-primary">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-chart-4 bg-clip-text text-transparent">
                  WorkshopFlow
                </h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5 tracking-wider uppercase">
                  Pro Platform
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator className="mx-4 w-auto" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && link.href !== '/employee/dashboard' && pathname.startsWith(link.href));
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium relative',
                  isActive
                    ? 'bg-primary/10 text-primary border-r-0'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ duration: 0.25 }}
                  />
                )}
                <Icon className={cn('w-5 h-5 shrink-0 relative z-10', isActive && 'text-primary')} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative z-10 truncate"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {link.label === 'Notifications' && unreadCount > 0 && sidebarOpen && (
                  <Badge
                    variant="destructive"
                    className="ml-auto relative z-10 text-[10px] h-5 w-5 p-0 flex items-center justify-center pulse-glow"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <Separator className="mx-4 w-auto" />

        {/* User section */}
        <div className="p-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <Avatar className="w-9 h-9 shrink-0 ring-2 ring-primary/20">
              <AvatarImage src={user?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {user?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate capitalize">{user?.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={signOut}
            className="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive w-full mt-1"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ChevronLeft
            className={cn(
              'w-3.5 h-3.5 text-muted-foreground transition-transform duration-300',
              !sidebarOpen && 'rotate-180'
            )}
          />
        </button>
      </motion.aside>
    </AnimatePresence>
  );
}
