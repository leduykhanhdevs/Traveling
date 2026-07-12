'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, PenSquare, Heart, MessageSquare, Loader2 } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { toast } from '@/components/ui/toaster';

type Post = {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  user: { email: string };
  _count?: { likes: number; comments: number };
};

export default function AppCommunityPage() {
  const { getToken } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    try {
      const token = await getToken();
      const data = await apiClient<any>('/api/v1/community/posts', { token });
      setPosts(Array.isArray(data) ? data : data?.posts || []);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const token = await getToken();
      await apiClient('/api/v1/community/posts', {
        method: 'POST', token,
        body: JSON.stringify({ content: newPost.trim() }),
      });
      toast({ title: 'Post published!' });
      setNewPost('');
      loadPosts();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof ApiError ? err.message : 'Failed to post', variant: 'destructive' });
    } finally { setPosting(false); }
  };

  const handleLike = async (postId: string) => {
    try {
      const token = await getToken();
      await apiClient(`/api/v1/community/posts/${postId}/like`, { method: 'POST', token });
      loadPosts();
    } catch {}
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Community</h1>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handlePost} className="space-y-3">
            <textarea
              className="w-full h-24 bg-transparent resize-none focus:outline-none text-sm border rounded-lg p-3"
              placeholder="Share your travel experience..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              maxLength={2000}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={posting || !newPost.trim()} size="sm" className="gap-1">
                {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PenSquare className="h-3.5 w-3.5" />}
                Post
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-20" /></CardContent></Card>)}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground">Be the first to share a travel experience!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">{post.user?.email || 'Traveler'}</p>
                <p className="text-sm mb-3">{post.content}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 hover:text-accent transition-colors">
                    <Heart className="h-3.5 w-3.5" />
                    {post._count?.likes || 0}
                  </button>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {post._count?.comments || 0}
                  </span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
