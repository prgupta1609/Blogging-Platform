import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Heart, MessageCircle, Share2, Eye, Calendar, User, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import MDEditor from '@uiw/react-md-editor';

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
  profiles: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

const BlogDetail = () => {
  const { slug } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchBlog();
      fetchRelatedBlogs();
      fetchComments();
      fetchLikes();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          profiles:author_id(id, username, full_name, avatar_url, bio),
          categories:category_id(name, slug)
        `)
        .eq('slug', slug)
        .eq('status', 'approved')
        .single();

      if (error) throw error;
      setBlog(data);

      // Increment view count
      await supabase.rpc('increment_blog_views', { blog_id: data.id });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading blog',
        description: error.message
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async () => {
    if (!blog) return;
    
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          profiles:author_id(id, username, full_name, avatar_url),
          categories:category_id(name, slug)
        `)
        .eq('status', 'approved')
        .eq('category_id', blog.category_id)
        .neq('id', blog.id)
        .order('view_count', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRelatedBlogs(data || []);
    } catch (error: any) {
      console.error('Error fetching related blogs:', error);
    }
  };

  const fetchComments = async () => {
    if (!blog) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:author_id(id, username, full_name, avatar_url)
        `)
        .eq('blog_id', blog.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchLikes = async () => {
    if (!blog || !user) return;
    
    try {
      // Get like count
      const { count, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('blog_id', blog.id);

      if (countError) throw countError;
      setLikeCount(count || 0);

      // Check if user liked
      const { data: userLike, error: userLikeError } = await supabase
        .from('likes')
        .select('*')
        .eq('blog_id', blog.id)
        .eq('user_id', profile?.id)
        .single();

      if (!userLikeError && userLike) {
        setIsLiked(true);
      }
    } catch (error: any) {
      console.error('Error fetching likes:', error);
    }
  };

  const handleLike = async () => {
    if (!user || !blog || !profile) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'Please sign in to like this article'
      });
      return;
    }

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('blog_id', blog.id)
          .eq('user_id', profile.id);

        if (error) throw error;
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([
            { blog_id: blog.id, user_id: profile.id }
          ]);

        if (error) throw error;
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating like',
        description: error.message
      });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !blog || !profile || !commentContent.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            blog_id: blog.id,
            author_id: profile.id,
            content: commentContent.trim()
          }
        ]);

      if (error) throw error;

      setCommentContent('');
      await fetchComments();
      toast({
        title: 'Comment added!',
        description: 'Your comment has been posted successfully.'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error posting comment',
        description: error.message
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog not found</h1>
          <Button asChild>
            <Link to="/">Go back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-background via-muted/20 to-background py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {blog.categories && (
                <Badge variant="secondary" className="mr-4">
                  {blog.categories.name}
                </Badge>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {blog.title}
            </h1>
            
            {blog.excerpt && (
              <p className="text-xl text-muted-foreground mb-6 max-w-3xl">
                {blog.excerpt}
              </p>
            )}

            {/* Author and Meta Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={blog.profiles.avatar_url} />
                  <AvatarFallback>
                    {blog.profiles.full_name?.[0]?.toUpperCase() || blog.profiles.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {blog.profiles.full_name || blog.profiles.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(blog.published_at || blog.created_at)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {blog.view_count} views
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {likeCount} likes
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {comments.length} comments
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {blog.featured_image && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <img
                src={blog.featured_image}
                alt={blog.title}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <MDEditor.Markdown source={blog.content} />
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  onClick={handleLike}
                  className="flex items-center gap-2"
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Liked' : 'Like'}
                </Button>
                
                <Button variant="outline" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              {blog.categories && (
                <Link to={`/category/${blog.categories.slug}`}>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    More {blog.categories.name}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Comments */}
      <section className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Comments ({comments.length})</h2>
            
            {/* Add Comment */}
            {user ? (
              <Card className="mb-8">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Add a comment</h3>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleComment} className="space-y-4">
                    <textarea
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    <Button type="submit" disabled={submittingComment || !commentContent.trim()}>
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-8">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Please sign in to leave a comment
                  </p>
                  <Button asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.profiles.avatar_url} />
                        <AvatarFallback>
                          {comment.profiles.full_name?.[0]?.toUpperCase() || comment.profiles.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">
                            {comment.profiles.full_name || comment.profiles.username}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-foreground">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {relatedBlogs.length > 0 && (
        <section className="py-8 border-t bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedBlogs.map((relatedBlog) => (
                  <Card key={relatedBlog.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {relatedBlog.featured_image && (
                        <img
                          src={relatedBlog.featured_image}
                          alt={relatedBlog.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h3 className="font-semibold mb-2 line-clamp-2">
                        <Link 
                          to={`/blog/${relatedBlog.slug}`}
                          className="hover:text-primary transition-colors"
                        >
                          {relatedBlog.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {relatedBlog.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{relatedBlog.profiles.username}</span>
                        <span>{formatDate(relatedBlog.published_at || relatedBlog.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default BlogDetail;
