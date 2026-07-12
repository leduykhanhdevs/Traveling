'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Globe, Bell, Shield, Trash2, Download } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Language & Locale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">App Language</label>
              <select className="w-full h-10 border rounded-lg px-3 bg-background text-sm">
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preferred Travel Language</label>
              <select className="w-full h-10 border rounded-lg px-3 bg-background text-sm">
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notification settings are managed through your device and the mobile app.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Account security is managed through Clerk. Visit your account settings to update your password, enable two-factor authentication, or manage active sessions.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Data & Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Request Data Export
          </Button>
          <div className="border-t pt-3 mt-3">
            <Button variant="destructive" size="sm" className="gap-2">
              <Trash2 className="h-3.5 w-3.5" />
              Delete Account
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This action is permanent and cannot be undone. All your data will be deleted.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
