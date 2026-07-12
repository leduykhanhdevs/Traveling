'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages, ArrowRightLeft, Copy, Loader2, Check } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { toast } from '@/components/ui/toaster';
import { SUPPORTED_LANGUAGES } from '@traveling/shared';

export default function TranslatorPage() {
  const { getToken } = useAuth();
  const [sourceText, setSourceText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const languages = SUPPORTED_LANGUAGES.filter((l) => l.code !== 'auto');

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setLoading(true);
    try {
      const token = await getToken();
      const data = await apiClient<any>('/api/v1/translate', {
        method: 'POST',
        token,
        body: JSON.stringify({
          sourceText: sourceText.trim(),
          sourceLang: sourceLang === 'auto' ? undefined : sourceLang,
          targetLang,
        }),
      });
      setTranslation(data.translatedText || data.translation || '');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Translation failed.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setSourceText(translation);
    setTranslation(sourceText);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Translation Center</h1>
        <p className="text-muted-foreground">
          Translate text between 50+ languages instantly.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Source */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <select
                className="text-sm bg-transparent border rounded-lg px-2 py-1"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
              >
                <option value="auto">Auto Detect</option>
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
            <textarea
              className="w-full h-40 bg-transparent resize-none focus:outline-none text-sm"
              placeholder="Enter text to translate..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              maxLength={5000}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">{sourceText.length}/5000</span>
              <Button onClick={handleTranslate} disabled={loading || !sourceText.trim()} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Translate'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Swap button (desktop: between cards) */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        </div>

        {/* Target */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <select
                className="text-sm bg-transparent border rounded-lg px-2 py-1"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
              <Button variant="ghost" size="icon" onClick={swapLanguages} aria-label="Swap languages">
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-40 text-sm whitespace-pre-wrap">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Translating...
                </div>
              ) : translation ? (
                translation
              ) : (
                <span className="text-muted-foreground">Translation will appear here...</span>
              )}
            </div>
            {translation && (
              <div className="flex justify-end mt-2">
                <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={swapLanguages} className="gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Swap Languages
        </Button>
      </div>
    </div>
  );
}
