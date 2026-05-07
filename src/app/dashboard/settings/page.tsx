'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Shield, Bell, Palette } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useAppStore();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
      toast.success('Settings saved!');
      setSaving(false);
    }, 1000);
  };

  return (
    <>
      <TopBar title="Settings" subtitle="Manage your preferences" />
      <div className="p-6 max-w-3xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" />Profile</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><Shield className="w-4 h-4" />Security</TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2"><Palette className="w-4 h-4" />Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Full Name</Label><Input defaultValue={user?.full_name} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input defaultValue={user?.email} disabled /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input defaultValue={user?.phone || ''} /></div>
                  <div className="space-y-2"><Label>Role</Label><Input defaultValue={user?.role} disabled className="capitalize" /></div>
                </div>
                <Button className="gradient-primary text-white" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Change Password</h3>
                  <div className="space-y-3">
                    <div className="space-y-2"><Label>Current Password</Label><Input type="password" /></div>
                    <div className="space-y-2"><Label>New Password</Label><Input type="password" /></div>
                    <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" /></div>
                  </div>
                  <Button variant="outline">Update Password</Button>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Sessions</h3>
                  <p className="text-sm text-muted-foreground">Manage active sessions across devices.</p>
                  <Button variant="outline" className="text-destructive">Sign out all devices</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">Dark Mode</p><p className="text-xs text-muted-foreground">Toggle dark/light theme</p></div>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">Email Notifications</p><p className="text-xs text-muted-foreground">Receive email updates</p></div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">Real-time Notifications</p><p className="text-xs text-muted-foreground">In-app notification updates</p></div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
