'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Wallet, Plus, Trash2, DollarSign } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { toast } from '@/components/ui/toaster';

type Budget = {
  id: string;
  tripName: string;
  totalBudget: number;
  currency: string;
  createdAt: string;
  _count?: { items: number };
};

export default function BudgetsPage() {
  const { getToken } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [tripName, setTripName] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadBudgets(); }, []);

  const loadBudgets = async () => {
    try {
      const token = await getToken();
      const data = await apiClient<Budget[]>('/api/v1/budget', { token });
      setBudgets(data || []);
    } catch { setBudgets([]); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName.trim() || !totalBudget) return;
    setCreating(true);
    try {
      const token = await getToken();
      await apiClient('/api/v1/budget', {
        method: 'POST', token,
        body: JSON.stringify({ tripName: tripName.trim(), totalBudget: parseFloat(totalBudget), currency }),
      });
      toast({ title: 'Budget created!' });
      setShowCreate(false);
      setTripName(''); setTotalBudget('');
      loadBudgets();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof ApiError ? err.message : 'Failed', variant: 'destructive' });
    } finally { setCreating(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Budget Manager</h1>
          <p className="text-muted-foreground">Track expenses and manage travel budgets.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Budget
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Trip Name</label>
                <Input value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="e.g. Tokyo Trip 2026" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Total Budget</label>
                  <Input type="number" min="0" step="0.01" value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} placeholder="1000" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select className="w-full h-10 border rounded-lg px-3 bg-background text-sm" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="USD">USD</option>
                    <option value="VND">VND</option>
                    <option value="EUR">EUR</option>
                    <option value="JPY">JPY</option>
                    <option value="THB">THB</option>
                    <option value="KRW">KRW</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Budget'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-20" /></CardContent></Card>)}
        </div>
      ) : budgets.length === 0 && !showCreate ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
            <p className="text-muted-foreground mb-4">Create your first travel budget to start tracking expenses.</p>
            <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" />Create Budget</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {budgets.map((budget) => (
            <Link key={budget.id} href={`/app/budgets/${budget.id}`}>
              <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg">{budget.tripName}</h3>
                  <p className="text-2xl font-bold mt-2">
                    {budget.currency} {budget.totalBudget.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created {new Date(budget.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
