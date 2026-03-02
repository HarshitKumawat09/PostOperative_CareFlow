'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { CaregiverContact, NotificationPreferences, NotificationChannel } from '@/types/notifications';

interface NotificationSettingsProps {
  patientId: string;
  patientName?: string;
}

const CHANNELS: { id: NotificationChannel; label: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'sms', label: 'SMS' },
];

function ensureE164India(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  // assume Indian number
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('91') && digits.length >= 12) return `+${digits}`;
  return `+91${digits}`;
}

export default function NotificationSettings({ patientId, patientName }: NotificationSettingsProps) {
  const [prefs, setPrefs] = React.useState<NotificationPreferences | null>(null);
  const [caregivers, setCaregivers] = React.useState<CaregiverContact[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [newCaregiverName, setNewCaregiverName] = React.useState('');
  const [newCaregiverPhone, setNewCaregiverPhone] = React.useState('');
  const [newCaregiverWhatsApp, setNewCaregiverWhatsApp] = React.useState(true);
  const [newCaregiverSms, setNewCaregiverSms] = React.useState(false);
  const [newCaregiverWeekly, setNewCaregiverWeekly] = React.useState(true);
  const [newCaregiverCritical, setNewCaregiverCritical] = React.useState(true);

  const loadAll = React.useCallback(async () => {
    if (!patientId) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const [prefsRes, caregiversRes] = await Promise.all([
        fetch(`/api/notifications/preferences?patientId=${encodeURIComponent(patientId)}`),
        fetch(`/api/notifications/caregivers?patientId=${encodeURIComponent(patientId)}`),
      ]);

      const prefsJson = await prefsRes.json();
      const caregiversJson = await caregiversRes.json();

      if (prefsJson?.success) setPrefs(prefsJson.data as NotificationPreferences);
      else setPrefs(null);

      if (caregiversJson?.success && Array.isArray(caregiversJson.data)) {
        setCaregivers(caregiversJson.data as CaregiverContact[]);
      } else {
        setCaregivers([]);
      }
    } catch (e) {
      setError('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const savePrefs = async (nextPrefs: NotificationPreferences) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextPrefs),
      });

      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Failed to save');

      setPrefs(json.data as NotificationPreferences);
      setSuccess('Saved preferences');
    } catch (e) {
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = (channel: NotificationChannel, checked: boolean) => {
    if (!prefs) return;
    const existing = new Set(prefs.channels);
    if (checked) existing.add(channel);
    else existing.delete(channel);

    const next = { ...prefs, channels: Array.from(existing) };
    setPrefs(next);
  };

  const addCaregiver = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const channels: NotificationChannel[] = [];
      if (newCaregiverWhatsApp) channels.push('whatsapp');
      if (newCaregiverSms) channels.push('sms');

      const phoneE164 = ensureE164India(newCaregiverPhone);
      if (!phoneE164) {
        setError('Please enter a valid phone number');
        return;
      }

      const res = await fetch('/api/notifications/caregivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          name: newCaregiverName || 'Caregiver',
          phoneE164,
          channels,
          receiveWeeklySummary: newCaregiverWeekly,
          receiveCriticalAlerts: newCaregiverCritical,
        }),
      });

      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Failed to add');

      setSuccess('Caregiver added');
      setNewCaregiverName('');
      setNewCaregiverPhone('');
      setNewCaregiverWhatsApp(true);
      setNewCaregiverSms(false);
      setNewCaregiverWeekly(true);
      setNewCaregiverCritical(true);
      await loadAll();
    } catch (e) {
      setError('Failed to add caregiver');
    } finally {
      setSaving(false);
    }
  };

  const removeCaregiver = async (caregiverId: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/notifications/caregivers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, caregiverId }),
      });

      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Failed to remove');

      setSuccess('Caregiver removed');
      await loadAll();
    } catch (e) {
      setError('Failed to remove caregiver');
    } finally {
      setSaving(false);
    }
  };

  const sendTestReminder = async () => {
    if (!prefs) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const channel = prefs.channels?.[0] || 'whatsapp';
      const to =
        ensureE164India(prefs.patientPhoneE164 || '') ||
        ensureE164India(newCaregiverPhone) ||
        caregivers[0]?.phoneE164 ||
        '';

      if (!to) {
        setError('Add your phone number (or a caregiver) to send a test reminder');
        return;
      }

      const res = await fetch('/api/notifications/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          patientName,
          to,
          channel,
          language: prefs.language,
          checkInUrl: `${window.location.origin}/patient/dashboard`,
        }),
      });

      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Failed to send');

      setSuccess(`Test reminder queued via ${json.data?.provider || 'provider'}`);
    } catch (e) {
      setError('Failed to send test reminder');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reminders & Caregivers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!prefs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reminders & Caregivers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Unable to load preferences.</div>
          {error ? (
            <Alert className="mt-3">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reminders & Caregivers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {success ? (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">Enable reminders</div>
            <div className="text-sm text-muted-foreground">Get WhatsApp/SMS check-in prompts</div>
          </div>
          <Switch
            checked={prefs.enabled}
            onCheckedChange={(checked) => {
              const next = { ...prefs, enabled: checked };
              setPrefs(next);
              savePrefs(next);
            }}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <div className="font-medium">Your phone number</div>
          <div className="text-sm text-muted-foreground">Used to send you reminders (E.164, e.g. +91xxxxxxxxxx)</div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="+91xxxxxxxxxx"
              value={prefs.patientPhoneE164 || ''}
              onChange={(e) => {
                const next = { ...prefs, patientPhoneE164: e.target.value };
                setPrefs(next);
              }}
              disabled={saving}
            />
            <Button variant="outline" onClick={() => savePrefs(prefs)} disabled={saving}>
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-medium">Channels</div>
          <div className="grid grid-cols-2 gap-3">
            {CHANNELS.map((c) => {
              const checked = prefs.channels.includes(c.id);
              return (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => toggleChannel(c.id, Boolean(v))}
                    disabled={saving}
                  />
                  {c.label}
                </label>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => savePrefs(prefs)}
            disabled={saving}
          >
            Save channels
          </Button>
        </div>

        <div className="space-y-2">
          <div className="font-medium">Reminder time (India)</div>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={prefs.reminderTimes?.[0] || '09:00'}
              onChange={(e) => {
                const next = { ...prefs, reminderTimes: [e.target.value] };
                setPrefs(next);
              }}
            />
            <Button
              variant="outline"
              onClick={() => savePrefs(prefs)}
              disabled={saving}
            >
              Save
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={prefs.remindIfNoLogToday}
              onCheckedChange={(v) => {
                const next = { ...prefs, remindIfNoLogToday: Boolean(v) };
                setPrefs(next);
                savePrefs(next);
              }}
              disabled={saving}
            />
            Remind me if I have not logged today
          </label>
        </div>

        <div className="space-y-2">
          <div className="font-medium">Caregivers</div>
          <div className="text-sm text-muted-foreground">
            Add a family member who can receive weekly summaries and critical alerts.
          </div>

          <div className="grid gap-2">
            <Input
              placeholder="Caregiver name"
              value={newCaregiverName}
              onChange={(e) => setNewCaregiverName(e.target.value)}
            />
            <Input
              placeholder="Phone (e.g. +91xxxxxxxxxx)"
              value={newCaregiverPhone}
              onChange={(e) => setNewCaregiverPhone(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={newCaregiverWhatsApp} onCheckedChange={(v) => setNewCaregiverWhatsApp(Boolean(v))} />
                WhatsApp
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={newCaregiverSms} onCheckedChange={(v) => setNewCaregiverSms(Boolean(v))} />
                SMS
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={newCaregiverWeekly} onCheckedChange={(v) => setNewCaregiverWeekly(Boolean(v))} />
              Send weekly summary
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={newCaregiverCritical} onCheckedChange={(v) => setNewCaregiverCritical(Boolean(v))} />
              Send critical alerts
            </label>

            <div className="flex items-center gap-2">
              <Button onClick={addCaregiver} disabled={saving}>
                Add caregiver
              </Button>
              <Button variant="outline" onClick={sendTestReminder} disabled={saving}>
                Send test reminder
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {caregivers.length === 0 ? (
              <div className="text-sm text-muted-foreground">No caregivers added.</div>
            ) : (
              caregivers.map((c) => (
                <div key={c.id} className="flex items-center justify-between border rounded-md p-2">
                  <div>
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.phoneE164}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.channels.map((ch) => (
                        <Badge key={ch} variant="outline" className="text-xs">
                          {ch}
                        </Badge>
                      ))}
                      {c.receiveWeeklySummary ? (
                        <Badge variant="outline" className="text-xs">weekly</Badge>
                      ) : null}
                      {c.receiveCriticalAlerts ? (
                        <Badge variant="outline" className="text-xs">critical</Badge>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCaregiver(c.id)}
                    disabled={saving}
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
