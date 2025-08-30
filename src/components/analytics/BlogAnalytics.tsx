import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Calendar,
  BarChart3,
  LineChart,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface BlogAnalytics {
  id: string;
  blog_id: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  published_at?: string;
}

const BlogAnalytics = () => {
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<string>('');
  const [analytics, setAnalytics] = useState<BlogAnalytics[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserBlogs();
  }, []);

  useEffect(() => {
    if (selectedBlog) {
      fetchBlogAnalytics();
    }
  }, [selectedBlog, timeRange]);

  const fetchUserBlogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, slug, status, created_at, published_at')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setBlogs(data || []);
      if (data && data.length > 0) {
        setSelectedBlog(data[0].id);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading blogs',
        description: error.message
      });
    }
  };

  const fetchBlogAnalytics = async () => {
    if (!selectedBlog) return;

    try {
      setLoading(true);
      
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('blog_analytics')
        .select('*')
        .eq('blog_id', selectedBlog)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      
      setAnalytics(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading analytics',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalStats = () => {
    const totals = analytics.reduce(
      (acc, day) => ({
        views: acc.views + day.views,
        likes: acc.likes + day.likes,
        comments: acc.comments + day.comments,
        shares: acc.shares + day.shares,
      }),
      { views: 0, likes: 0, comments: 0, shares: 0 }
    );

    return totals;
  };

  const getAverageStats = () => {
    if (analytics.length === 0) return { views: 0, likes: 0, comments: 0, shares: 0 };
    
    const totals = getTotalStats();
    return {
      views: Math.round(totals.views / analytics.length),
      likes: Math.round(totals.likes / analytics.length),
      comments: Math.round(totals.comments / analytics.length),
      shares: Math.round(totals.shares / analytics.length),
    };
  };

  const getGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const selectedBlogData = blogs.find(blog => blog.id === selectedBlog);

  if (blogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Blog Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No blogs found. Create your first blog to see analytics!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Blog Analytics</h2>
          <p className="text-muted-foreground">
            Track your blog performance and engagement metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedBlog} onValueChange={setSelectedBlog}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select a blog" />
            </SelectTrigger>
            <SelectContent>
              {blogs.map((blog) => (
                <SelectItem key={blog.id} value={blog.id}>
                  {blog.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedBlogData && (
        <>
          {/* Blog Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedBlogData.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created {formatDistanceToNow(new Date(selectedBlogData.created_at), { addSuffix: true })}
                    </span>
                    {selectedBlogData.published_at && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        Published {formatDistanceToNow(new Date(selectedBlogData.published_at), { addSuffix: true })}
                      </span>
                    )}
                    <Badge variant={selectedBlogData.status === 'approved' ? 'default' : 'secondary'}>
                      {selectedBlogData.status}
                    </Badge>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  /blog/{selectedBlogData.slug}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalStats().views.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {getAverageStats().views} avg/day
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalStats().likes.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {getAverageStats().likes} avg/day
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalStats().comments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {getAverageStats().comments} avg/day
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalStats().shares.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {getAverageStats().shares} avg/day
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-green-500" />
                Performance Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : analytics.length > 0 ? (
                <div className="space-y-4">
                  {analytics.map((day) => (
                    <div key={day.date} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {day.date}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">{day.views}</div>
                          <div className="text-xs text-muted-foreground">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-red-600">{day.likes}</div>
                          <div className="text-xs text-muted-foreground">Likes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">{day.comments}</div>
                          <div className="text-xs text-muted-foreground">Comments</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-purple-600">{day.shares}</div>
                          <div className="text-xs text-muted-foreground">Shares</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No analytics data available for the selected time range.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default BlogAnalytics;
