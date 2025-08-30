import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import BlogCard from '@/components/blog/BlogCard';
import { ArrowLeft, Search, Filter, TrendingUp, Clock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Blog {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  slug: string;
  featured_image?: string;
  author_id: string;
  status: string;
  view_count: number;
  is_featured: boolean;
  published_at?: string;
  created_at: string;
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

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
}

const CategoryPage = () => {
  const { categorySlug } = useParams();
  const { toast } = useToast();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  
  const blogsPerPage = 12;

  useEffect(() => {
    if (categorySlug) {
      fetchCategory();
      fetchBlogs();
    }
  }, [categorySlug, searchQuery, sortBy, currentPage]);

  const fetchCategory = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .single();

      if (error) throw error;
      setCategory(data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading category',
        description: error.message
      });
    }
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('blogs')
        .select(`
          *,
          profiles:author_id(id, username, full_name, avatar_url),
          categories:category_id(name, slug)
        `, { count: 'exact' })
        .eq('status', 'approved')
        .eq('categories.slug', categorySlug);

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'latest':
          query = query.order('published_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('published_at', { ascending: true });
          break;
        case 'trending':
          query = query.order('view_count', { ascending: false });
          break;
        case 'title':
          query = query.order('title', { ascending: true });
          break;
      }

      // Apply pagination
      const from = (currentPage - 1) * blogsPerPage;
      const to = from + blogsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setBlogs(data || []);
      setTotalBlogs(count || 0);
      setTotalPages(Math.ceil((count || 0) / blogsPerPage));
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-background via-muted/20 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <Link to="/" className="mr-4">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                {category.name}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {category.name} Articles
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {category.description}
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Sort Options */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sort by:</span>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Latest
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Oldest
                    </div>
                  </SelectItem>
                  <SelectItem value="trending">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Trending
                    </div>
                  </SelectItem>
                  <SelectItem value="title">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Title A-Z
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Results Count */}
      <section className="py-4">
        <div className="container mx-auto px-4">
          <p className="text-muted-foreground">
            Showing {blogs.length} of {totalBlogs} articles
          </p>
        </div>
      </section>

      {/* Blogs Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-48 bg-muted rounded-lg mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded mb-2 w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : blogs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} showActions />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => handlePageChange(page)}
                        className="w-10 h-10 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No articles found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No articles found for "${searchQuery}" in ${category.name}`
                    : `No articles found in ${category.name}`
                  }
                </p>
                <Button asChild>
                  <Link to="/write">Write the first article</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;
