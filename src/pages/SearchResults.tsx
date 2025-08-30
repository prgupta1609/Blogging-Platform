import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import BlogCard from '@/components/blog/BlogCard';
import { Search, Filter, TrendingUp, Clock, Eye, ArrowLeft, BookOpen } from 'lucide-react';
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
  slug: string;
}

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  const blogsPerPage = 12;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setCurrentPage(1);
      performSearch();
    }
  }, [searchQuery, selectedCategory, sortBy, currentPage]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setBlogs([]);
      setTotalResults(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }

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
        .or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);

      // Apply category filter
      if (selectedCategory) {
        query = query.eq('categories.slug', selectedCategory);
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
        case 'relevance':
        default:
          // For relevance, we'll order by featured first, then by view count
          query = query.order('is_featured', { ascending: false })
                      .order('view_count', { ascending: false });
          break;
      }

      // Apply pagination
      const from = (currentPage - 1) * blogsPerPage;
      const to = from + blogsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setBlogs(data || []);
      setTotalResults(count || 0);
      setTotalPages(Math.ceil((count || 0) / blogsPerPage));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error performing search',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateSearchParams();
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('relevance');
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery.trim() || selectedCategory || sortBy !== 'relevance';

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
              <BookOpen className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Search Results
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find the articles you're looking for
            </p>
          </div>
        </div>
      </section>

      {/* Search Form */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type="search"
                      placeholder="Search articles, authors, or topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 text-lg"
                    />
                  </div>
                </div>
                <Button type="submit" size="lg" className="lg:w-auto">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filters:</span>
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Relevance
                      </div>
                    </SelectItem>
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

                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} size="sm">
                    Clear Filters
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Results Count */}
            {searchQuery.trim() && (
              <div className="mb-6">
                <p className="text-muted-foreground">
                  {loading ? 'Searching...' : `Found ${totalResults} result${totalResults !== 1 ? 's' : ''} for "${searchQuery}"`}
                </p>
              </div>
            )}

            {/* Results */}
            {!searchQuery.trim() ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Start your search</h3>
                  <p className="text-muted-foreground mb-4">
                    Enter a search term above to find articles, authors, or topics that interest you.
                  </p>
                </div>
              </div>
            ) : loading ? (
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
                  <h3 className="text-xl font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-4">
                    No articles found for "{searchQuery}". Try adjusting your search terms or filters.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                    <Button asChild>
                      <Link to="/write">Write an article</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SearchResults;
