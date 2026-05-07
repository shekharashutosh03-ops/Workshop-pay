'use client';

import { TopBar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

export default function EmployeeSettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useAppStore();

  return (
    <>
      <TopBar title="Settings" subtitle="Manage your account" />
      <div className="p-6 max-w-2xl space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16"><AvatarImage src={user?.avatar_url || ''} /><AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{user?.full_name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
              <div><p className="font-medium">{user?.full_name}</p><p className="text-sm text-muted-foreground">{user?.email}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input defaultValue={user?.full_name} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input defaultValue={user?.phone || ''} /></div>
            </div>
            <Button className="gradient-primary text-white" onClick={() => toast.success('Saved!')}>Save</Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Dark Mode</p></div><Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} /></div>
            <Separator />
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Notifications</p></div><Switch defaultChecked /></div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Security</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Current Password</Label><Input type="password" /></div>
            <div className="space-y-2"><Label>New Password</Label><Input type="password" /></div>
            <Button variant="outline">Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
