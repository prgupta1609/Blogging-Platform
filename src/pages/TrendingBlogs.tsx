import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  Calendar, 
  Search,
  Filter,
  Flame,
  Rocket,
  Star,
  Zap
} from 'lucide-react';
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
  const [filteredBlogs, setFilteredBlogs] = useState<TrendingBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'engagement' | 'views' | 'likes' | 'comments' | 'recent'>('engagement');

  useEffect(() => {
    fetchTrendingBlogs();
  }, []);

  useEffect(() => {
    filterAndSortBlogs();
  }, [trendingBlogs, searchQuery, categoryFilter, timeFilter, sortBy]);

  const fetchTrendingBlogs = async () => {
    try {
      setLoading(true);
      
      // Call the database function to get trending blogs
      const { data, error } = await supabase
        .rpc('get_trending_blogs', { limit_count: 50 });

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

  const filterAndSortBlogs = () => {
    let filtered = [...trendingBlogs];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(blog =>
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.author_username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(blog => blog.category_name === categoryFilter);
    }

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeFilter) {
        case 'today':
          filterDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(blog => new Date(blog.created_at) >= filterDate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'engagement':
          return b.total_engagement - a.total_engagement;
        case 'views':
          return b.views_today - a.views_today;
        case 'likes':
          return b.likes_count - a.likes_count;
        case 'comments':
          return b.comments_count - a.comments_count;
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredBlogs(filtered);
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 50) return 'text-red-500';
    if (engagement >= 20) return 'text-orange-500';
    if (engagement >= 10) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getEngagementBadge = (engagement: number) => {
    if (engagement >= 50) return { text: '🔥 Viral', icon: Flame };
    if (engagement >= 20) return { text: '🚀 Trending', icon: Rocket };
    if (engagement >= 10) return { text: '📈 Popular', icon: Star };
    return { text: '✨ New', icon: Zap };
  };

  const getCategories = () => {
    const categories = [...new Set(trendingBlogs.map(blog => blog.category_name).filter(Boolean))];
    return categories.sort();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrendingUp className="h-12 w-12 text-orange-500" />
            <h1 className="text-4xl font-bold">Trending Blogs</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the most engaging and popular content from our community of writers
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search trending blogs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Time Filter */}
              <Select value={timeFilter} onValueChange={(value: 'all' | 'today' | 'week' | 'month') => setTimeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value: 'engagement' | 'views' | 'likes' | 'comments' | 'recent') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="views">Views Today</SelectItem>
                  <SelectItem value="likes">Likes</SelectItem>
                  <SelectItem value="comments">Comments</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing {filteredBlogs.length} of {trendingBlogs.length} trending blogs
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
              setTimeFilter('all');
              setSortBy('engagement');
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>

        {/* Trending Blogs Grid */}
        {filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog, index) => {
              const engagementBadge = getEngagementBadge(blog.total_engagement);
              const BadgeIcon = engagementBadge.icon;
              
              return (
                <Card key={blog.blog_id} className="group hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    {/* Ranking and Engagement Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        #{index + 1}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getEngagementColor(blog.total_engagement)} border-current`}
                      >
                        <BadgeIcon className="h-3 w-3 mr-1" />
                        {engagementBadge.text}
                      </Badge>
                    </div>

                    {/* Featured Image */}
                    {blog.featured_image && (
                      <div className="mb-4">
                        <img
                          src={blog.featured_image}
                          alt={blog.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        <Link to={`/blog/${blog.slug}`}>
                          {blog.title}
                        </Link>
                      </h3>

                      {blog.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {blog.excerpt}
                        </p>
                      )}

                      {/* Meta Information */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(blog.created_at), { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {blog.views_today} today
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {blog.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {blog.comments_count}
                          </span>
                        </div>
                      </div>

                      {/* Author and Category */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">
                          by {blog.author_name || blog.author_username}
                        </span>
                        {blog.category_name && (
                          <Badge variant="outline" className="text-xs">
                            {blog.category_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No trending blogs found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms to find more content.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setTimeFilter('all');
                  setSortBy('engagement');
                }}
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrendingBlogs;
