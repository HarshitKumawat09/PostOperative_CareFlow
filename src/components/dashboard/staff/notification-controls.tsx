'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

export default function NotificationControls() {
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [checkInUrl, setCheckInUrl] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setCheckInUrl(`${window.location.origin}/patient/dashboard`);
    }
  }, []);

  const runDaily = async () => {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/notifications/run-daily-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkInUrl }),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Failed');
      setResult({ type: 'daily', data: json.data });
    } catch (e) {
      setError('Failed to run daily reminders');
    } finally {
      setRunning(false);
    }
  };

  const runWeekly = async () => {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/notifications/run-weekly-summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Failed');
      setResult({ type: 'weekly', data: json.data });
    } catch (e) {
      setError('Failed to run weekly summaries');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Console Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Check-in URL used in reminder messages</div>
          <Input value={checkInUrl} onChange={(e) => setCheckInUrl(e.target.value)} placeholder="https://.../patient/dashboard" />
        </div>

        <div className="flex gap-2">
          <Button onClick={runDaily} disabled={running}>Run daily reminders (console)</Button>
          <Button variant="outline" onClick={runWeekly} disabled={running}>Run weekly summaries (console)</Button>
        </div>

        {result ? (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription>
              <div className="text-sm">
                <div><strong>Run:</strong> {result.type}</div>
                <div><strong>Processed:</strong> {Array.isArray(result.data) ? result.data.length : 0}</div>
                <div className="mt-2">Open server console to view the sent messages.</div>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
