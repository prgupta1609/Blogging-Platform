import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import BlogCard from '@/components/blog/BlogCard';

interface Blog {
  id: string;
  title: string;
  content: string;
  slug: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  view_count: number;
  created_at: string;
  published_at?: string;
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

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [stats, setStats] = useState({
    totalBlogs: 0,
    pendingBlogs: 0,
    approvedBlogs: 0,
    totalUsers: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (profile && profile.role !== 'admin') {
      navigate('/');
      toast({
        variant: 'destructive',
        title: 'Access denied',
        description: 'You do not have admin privileges'
      });
      return;
    }

    if (profile) {
      fetchData();
    }
  }, [user, profile, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch blogs with author info
      const { data: blogsData, error: blogsError } = await supabase
        .from('blogs')
        .select(`
          *,
          profiles:author_id(id, username, full_name, avatar_url),
          categories:category_id(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (blogsError) throw blogsError;

      // Fetch stats
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) throw usersError;

      const totalViews = blogsData?.reduce((sum, blog) => sum + blog.view_count, 0) || 0;
      
      setBlogs(blogsData || []);
      setStats({
        totalBlogs: blogsData?.length || 0,
        pendingBlogs: blogsData?.filter(b => b.status === 'pending').length || 0,
        approvedBlogs: blogsData?.filter(b => b.status === 'approved').length || 0,
        totalUsers: usersData?.length || 0,
        totalViews
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading data',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlogAction = async (blogId: string, action: 'approve' | 'reject' | 'delete' | 'hide' | 'unhide') => {
    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('blogs')
          .delete()
          .eq('id', blogId);
        
        if (error) throw error;
        
        toast({
          title: 'Blog deleted',
          description: 'The blog has been permanently deleted'
        });
      } else if (action === 'hide' || action === 'unhide') {
        const { error } = await supabase
          .from('blogs')
          .update({ 
            is_hidden: action === 'hide'
          })
          .eq('id', blogId);
        
        if (error) throw error;
        
        toast({
          title: `Blog ${action === 'hide' ? 'hidden' : 'unhidden'}`,
          description: `The blog has been ${action === 'hide' ? 'hidden from public view' : 'made visible again'}`
        });
      } else {
        const status = action === 'approve' ? 'approved' : 'rejected';
        const published_at = action === 'approve' ? new Date().toISOString() : null;
        
        const { error } = await supabase
          .from('blogs')
          .update({ 
            status,
            published_at
          })
          .eq('id', blogId);
        
        if (error) throw error;
        
        toast({
          title: `Blog ${action}d`,
          description: `The blog has been ${action}d successfully`
        });
      }
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: `Error ${action}ing blog`,
        description: error.message
      });
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         blog.profiles.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || blog.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage blog submissions and monitor platform activity
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blogs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBlogs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingBlogs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedBlogs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Blog Management */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Management</CardTitle>
          <CardDescription>
            Review and manage blog submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
              
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search blogs or authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <TabsContent value={selectedStatus} className="space-y-4">
              {filteredBlogs.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No blogs found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBlogs.map((blog) => (
                    <Card key={blog.id} className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold line-clamp-1">
                              {blog.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  blog.status === 'approved' ? 'default' :
                                  blog.status === 'pending' ? 'secondary' :
                                  blog.status === 'rejected' ? 'destructive' : 
                                  'outline'
                                }
                              >
                                {blog.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span>By {blog.profiles.username}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(blog.created_at), { addSuffix: true })}</span>
                            <span>•</span>
                            <span>{blog.view_count} views</span>
                            {blog.categories && (
                              <>
                                <span>•</span>
                                <span>{blog.categories.name}</span>
                              </>
                            )}
                          </div>
                          
                          <p className="text-muted-foreground line-clamp-2 mb-4">
                            {blog.content.substring(0, 200)}...
                          </p>
                          
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </a>
                            </Button>
                            
                            {blog.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleBlogAction(blog.id, 'approve')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleBlogAction(blog.id, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            {blog.status === 'approved' && (
                              <>
                                {blog.is_hidden ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleBlogAction(blog.id, 'unhide')}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Unhide
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleBlogAction(blog.id, 'hide')}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Hide
                                  </Button>
                                )}
                              </>
                            )}
                            
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleBlogAction(blog.id, 'delete')}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;