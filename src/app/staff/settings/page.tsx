'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Settings</h1>
      <p className="text-muted-foreground">
        Manage your account settings and preferences.
      </p>
      
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose how you receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive an email for new patient logs and messages.
              </p>
            </div>
            <Switch
              id="email-notifications"
              aria-label="Toggle email notifications"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications" className="text-base">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get push notifications on your devices. (Coming soon)
              </p>
            </div>
            <Switch
              id="push-notifications"
              aria-label="Toggle push notifications"
              disabled
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account details.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="destructive">Delete Account</Button>
            <p className="text-xs text-muted-foreground mt-2">Permanently delete your account and all associated data. This action cannot be undone.</p>
        </CardContent>
      </Card>
    </div>
  );
}
