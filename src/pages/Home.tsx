import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  TrendingUp, 
  Clock, 
  Eye, 
  Heart, 
  MessageCircle, 
  ArrowRight,
  Sparkles,
  Star,
  Users,
  BookOpen,
  Zap,
  Globe,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TrendingBlogs from '@/components/blog/TrendingBlogs';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  featured_image: string;
  view_count: number;
  created_at: string;
  published_at?: string;
  author_id: string;
  category_id: string;
  status: string;
  profiles: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  categories?: {
    name: string;
    slug: string;
  };
}

const Home = () => {
  const [featuredBlogs, setFeaturedBlogs] = useState<Blog[]>([]);
  const [latestBlogs, setLatestBlogs] = useState<Blog[]>([]);
  const [trendingBlogs, setTrendingBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);

      // Fetch featured blogs
      const { data: featured, error: featuredError } = await supabase
        .from('blogs')
        .select(`
          *,
          profiles:author_id(id, username, full_name, avatar_url),
          categories:category_id(name, slug)
        `)
        .eq('status', 'approved')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(3);

      if (featuredError) throw featuredError;

      // Fetch latest blogs
      const { data: latest, error: latestError } = await supabase
        .from('blogs')
        .select(`
          *,
          profiles:author_id(id, username, full_name, avatar_url),
          categories:category_id(name, slug)
        `)
        .eq('status', 'approved')
        .order('published_at', { ascending: false })
        .limit(6);

      if (latestError) throw latestError;

      // Fetch trending blogs
      const { data: trending, error: trendingError } = await supabase
        .from('blogs')
        .select(`
          *,
          profiles:author_id(id, username, full_name, avatar_url),
          categories:category_id(name, slug)
        `)
        .eq('status', 'approved')
        .order('view_count', { ascending: false })
        .limit(5);

      if (trendingError) throw trendingError;

      setFeaturedBlogs(featured || []);
      setLatestBlogs(latest || []);
      setTrendingBlogs(trending || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading blogs',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-8">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Discover Amazing
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Stories & Ideas
            </span>
          </h1>
          
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join thousands of readers exploring the best content from passionate writers. 
            From technology insights to lifestyle tips, find your next favorite read.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search for articles, topics, or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-4 text-lg border-0 shadow-2xl focus:ring-4 focus:ring-white/20"
              />
              <Button 
                size="lg" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 px-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                Search
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">1,247+</div>
              <div className="text-blue-200">Published Articles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">89+</div>
              <div className="text-blue-200">Active Writers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">24h</div>
              <div className="text-blue-200">Avg. Review Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Blogs Section */}
      {featuredBlogs.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Featured Stories</h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Handpicked articles that showcase the best content from our community
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredBlogs.map((blog) => (
                <Card key={blog.id} className="group bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  {blog.featured_image && (
                    <div className="relative overflow-hidden rounded-t-xl">
                      <img
                        src={blog.featured_image}
                        alt={blog.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                          Featured
                        </Badge>
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="space-y-3">
                      {blog.categories && (
                        <Badge variant="secondary" className="px-3 py-1">
                          {blog.categories.name}
                        </Badge>
                      )}
                      <CardTitle className="text-xl leading-tight group-hover:text-blue-600 transition-colors duration-200">
                        <Link to={`/blog/${blog.slug}`}>
                          {truncateText(blog.title, 60)}
                        </Link>
                      </CardTitle>
                      <CardDescription className="text-slate-600 leading-relaxed">
                        {truncateText(blog.excerpt || blog.content, 120)}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {blog.profiles.avatar_url ? (
                          <img
                            src={blog.profiles.avatar_url}
                            alt={blog.profiles.full_name || blog.profiles.username}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {(blog.profiles.full_name || blog.profiles.username).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {blog.profiles.full_name || blog.profiles.username}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(blog.published_at || blog.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{blog.view_count}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Latest Blogs */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Latest Articles</h2>
                    <p className="text-slate-600">Fresh content from our community</p>
                  </div>
                </div>
                <Button variant="outline" className="border-slate-300 hover:border-slate-400">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {latestBlogs.map((blog) => (
                  <Card key={blog.id} className="group bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                    <div className="flex flex-col md:flex-row">
                      {blog.featured_image && (
                        <div className="md:w-48 h-48 md:h-auto overflow-hidden rounded-l-xl md:rounded-l-none md:rounded-t-xl">
                          <img
                            src={blog.featured_image}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-6">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            {blog.categories && (
                              <Badge variant="secondary" className="px-3 py-1">
                                {blog.categories.name}
                              </Badge>
                            )}
                            <span className="text-sm text-slate-500">
                              {formatDate(blog.published_at || blog.created_at)}
                            </span>
                          </div>
                          
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                            <Link to={`/blog/${blog.slug}`}>
                              {blog.title}
                            </Link>
                          </h3>
                          
                          <p className="text-slate-600 leading-relaxed">
                            {truncateText(blog.excerpt || blog.content, 150)}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {blog.profiles.avatar_url ? (
                                <img
                                  src={blog.profiles.avatar_url}
                                  alt={blog.profiles.full_name || blog.profiles.username}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-semibold">
                                    {(blog.profiles.full_name || blog.profiles.username).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {blog.profiles.full_name || blog.profiles.username}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-slate-500">
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{blog.view_count}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Trending Sidebar */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Trending Now</h2>
                  <p className="text-slate-600">What's hot today</p>
                </div>
              </div>
              
              <TrendingBlogs />
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-8">
            <Zap className="h-10 w-10 text-white" />
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Share Your Story?
          </h2>
          
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join our community of writers and share your knowledge, experiences, and insights with readers around the world.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg">
              Start Writing Today
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/30 text-white hover:bg-white/10">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;