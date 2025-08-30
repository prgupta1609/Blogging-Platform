import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Save, X, Eye, Trash2, PenTool, Calendar, Eye as ViewIcon, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BlogCard from '@/components/blog/BlogCard';
import BlogAnalytics from '@/components/analytics/BlogAnalytics';

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
  categories?: {
    name: string;
    slug: string;
  };
}

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Check for tab parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['profile', 'blogs', 'stats'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);
  
  const [profileData, setProfileData] = useState({
    username: profile?.username || '',
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserBlogs();
  }, [user, navigate]);

  useEffect(() => {
    if (profile) {
      setProfileData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const fetchUserBlogs = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          categories:category_id(name, slug)
        `)
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading blogs',
        description: error.message
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileData.username,
          full_name: profileData.full_name,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      setEditing(false);
      toast({
        title: 'Profile updated!',
        description: 'Your profile has been updated successfully.'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating profile',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      return;
    }

    try {
      // First, remove from local state immediately for better UX
      setBlogs(prev => prev.filter(blog => blog.id !== blogId));
      
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', blogId);

      if (error) {
        // If deletion failed, restore the blog in local state
        await fetchUserBlogs();
        throw error;
      }
      
      toast({
        title: 'Blog deleted!',
        description: 'Your blog has been deleted successfully.'
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to delete blog. ';
      if (error.code === '42501') {
        errorMessage += 'You do not have permission to delete this blog.';
      } else if (error.code === '23503') {
        errorMessage += 'This blog cannot be deleted because it has associated data.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Error deleting blog',
        description: errorMessage
      });
    }
  };

  const handleSubmitForReview = async (blogId: string) => {
    if (!confirm('Submit this blog for admin review? You won\'t be able to edit it until it\'s reviewed.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blogs')
        .update({ 
          status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .eq('id', blogId);

      if (error) throw error;

      // Refresh the blogs list
      await fetchUserBlogs();
      
      toast({
        title: 'Blog submitted for review!',
        description: 'Your blog has been submitted and is pending admin approval. You\'ll be notified of the status.'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error submitting blog',
        description: error.message
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">🚀 Published</Badge>;
      case 'pending':
        return <Badge variant="secondary">⏳ Pending Review</Badge>;
      case 'draft':
        return <Badge variant="outline">📝 Draft</Badge>;
      case 'rejected':
        return <Badge variant="destructive">❌ Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-background via-muted/20 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-3xl font-bold mb-2">
                {profile.full_name || profile.username}
              </h1>
              {profile.bio && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {profile.bio}
                </p>
              )}
              <div className="flex items-center justify-center gap-4 mt-4">
                <Badge variant="secondary">
                  {profile.role === 'admin' ? 'Administrator' : 'Writer'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Member since {formatDate(profile.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="blogs">My Blogs</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Profile Information</CardTitle>
                      {!editing ? (
                        <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button onClick={handleSaveProfile} disabled={loading} size="sm">
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Saving...' : 'Save'}
                          </Button>
                          <Button onClick={() => setEditing(false)} variant="outline" size="sm">
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        {editing ? (
                          <Input
                            id="username"
                            value={profileData.username}
                            onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                            required
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            {profile.username}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        {editing ? (
                          <Input
                            id="full_name"
                            value={profileData.full_name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            {profile.full_name || 'Not provided'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      {editing ? (
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Tell us about yourself..."
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">
                          {profile.bio || 'No bio provided'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar_url">Avatar URL</Label>
                      {editing ? (
                        <Input
                          id="avatar_url"
                          type="url"
                          value={profileData.avatar_url}
                          onChange={(e) => setProfileData(prev => ({ ...prev, avatar_url: e.target.value }))}
                          placeholder="https://example.com/avatar.jpg"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">
                          {profile.avatar_url || 'No avatar set'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

                             {/* Blogs Tab */}
               <TabsContent value="blogs" className="space-y-6">
                 <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-bold">My Blogs</h2>
                   <Button asChild>
                     <Link to="/write">
                       <PenTool className="h-4 w-4 mr-2" />
                       Write New Blog
                     </Link>
                   </Button>
                 </div>

                 {/* Blog Status Summary */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="text-center p-4 bg-muted/50 rounded-lg">
                     <div className="text-2xl font-bold text-primary">{blogs.filter(b => b.status === 'draft').length}</div>
                     <div className="text-sm text-muted-foreground">Drafts</div>
                   </div>
                   <div className="text-center p-4 bg-muted/50 rounded-lg">
                     <div className="text-2xl font-bold text-yellow-600">{blogs.filter(b => b.status === 'pending').length}</div>
                     <div className="text-sm text-muted-foreground">Pending</div>
                   </div>
                   <div className="text-center p-4 bg-muted/50 rounded-lg">
                     <div className="text-2xl font-bold text-green-600">{blogs.filter(b => b.status === 'approved').length}</div>
                     <div className="text-sm text-muted-foreground">Published</div>
                   </div>
                   <div className="text-center p-4 bg-muted/50 rounded-lg">
                     <div className="text-2xl font-bold text-red-600">{blogs.filter(b => b.status === 'rejected').length}</div>
                     <div className="text-sm text-muted-foreground">Rejected</div>
                   </div>
                 </div>

                {blogs.length > 0 ? (
                  <div className="space-y-6">
                    {blogs.map((blog) => (
                      <Card key={blog.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusBadge(blog.status)}
                                {blog.categories && (
                                  <Badge variant="outline">
                                    {blog.categories.name}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-xl font-semibold mb-2">
                                {blog.title}
                              </h3>
                              {blog.excerpt && (
                                <p className="text-muted-foreground mb-3">
                                  {blog.excerpt}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(blog.created_at)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <ViewIcon className="h-4 w-4" />
                                  {blog.view_count} views
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/blog/${blog.slug}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                                                             {blog.status === 'draft' && (
                                 <>
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => navigate(`/write?edit=${blog.id}`)}
                                   >
                                     <Edit className="h-4 w-4 mr-2" />
                                     Edit
                                   </Button>
                                   <Button
                                     variant="default"
                                     size="sm"
                                     onClick={() => handleSubmitForReview(blog.id)}
                                   >
                                     <Send className="h-4 w-4 mr-2" />
                                     Submit for Review
                                   </Button>
                                 </>
                               )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBlog(blog.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <PenTool className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No blogs yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start writing your first blog post and share your thoughts with the world.
                      </p>
                      <Button asChild>
                        <Link to="/write">
                          <PenTool className="h-4 w-4 mr-2" />
                          Write Your First Blog
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="stats" className="space-y-6">
                <BlogAnalytics />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
