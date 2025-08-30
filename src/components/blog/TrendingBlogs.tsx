import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, Heart, MessageCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface TrendingBlog {
  blog_id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  author_name: string;
  author_username: string;
  category_name: string;
  total_engagement: number;
  views_today: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

const TrendingBlogs = () => {
  const { toast } = useToast();
  const [trendingBlogs, setTrendingBlogs] = useState<TrendingBlog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingBlogs();
  }, []);

  const fetchTrendingBlogs = async () => {
    try {
      setLoading(true);
      
      // Call the database function to get trending blogs
      const { data, error } = await supabase
        .rpc('get_trending_blogs', { limit_count: 5 });

      if (error) throw error;
      
      setTrendingBlogs(data || []);
    } catch (error: any) {
      console.error('Error fetching trending blogs:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading trending blogs',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 50) return 'text-red-500';
    if (engagement >= 20) return 'text-orange-500';
    if (engagement >= 10) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getEngagementBadge = (engagement: number) => {
    if (engagement >= 50) return '🔥 Viral';
    if (engagement >= 20) return '🚀 Trending';
    if (engagement >= 10) return '📈 Popular';
    return '✨ New';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Trending Blogs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trendingBlogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Trending Blogs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No trending blogs yet. Be the first to create engaging content!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          Trending Blogs
          <Badge variant="secondary" className="ml-auto">
            {trendingBlogs.length} blogs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trendingBlogs.map((blog, index) => (
            <div key={blog.blog_id} className="group">
              <Link to={`/blog/${blog.slug}`} className="block">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  {/* Ranking */}
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {blog.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getEngagementColor(blog.total_engagement)}`}
                      >
                        {getEngagementBadge(blog.total_engagement)}
                      </Badge>
                    </div>

                    {blog.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {blog.excerpt}
                      </p>
                    )}

                    {/* Meta information */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(blog.created_at), { addSuffix: true })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {blog.views_today} today
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {blog.likes_count}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {blog.comments_count}
                      </span>
                    </div>

                    {/* Author and category */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        by {blog.author_name || blog.author_username}
                      </span>
                      {blog.category_name && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <Badge variant="outline" className="text-xs">
                            {blog.category_name}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* View all trending blogs link */}
        <div className="mt-6 pt-4 border-t">
          <Link 
            to="/trending" 
            className="text-sm text-primary hover:underline flex items-center gap-1 justify-center"
          >
            View all trending blogs
            <TrendingUp className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingBlogs;
