import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Heart, MessageCircle, Eye, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BlogCardProps {
  blog: {
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
    _count?: {
      comments: number;
      likes: number;
    };
  };
  showActions?: boolean;
  variant?: 'default' | 'featured' | 'compact';
}

const BlogCard = ({ blog, showActions = false, variant = 'default' }: BlogCardProps) => {
  const readingTime = Math.ceil(blog.content.split(' ').length / 200);
  const publishedDate = blog.published_at || blog.created_at;
  
  const getExcerpt = () => {
    if (blog.excerpt) return blog.excerpt;
    // Generate excerpt from content (strip markdown)
    const plainText = blog.content.replace(/[#*`\[\]]/g, '');
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  };

  if (variant === 'featured') {
    return (
      <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="relative">
          {blog.featured_image && (
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src={blog.featured_image}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            {blog.categories && (
              <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-white/30">
                {blog.categories.name}
              </Badge>
            )}
            <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
              <Link
                to={`/blog/${blog.slug}`}
                className="hover:underline"
              >
                {blog.title}
              </Link>
            </h2>
            <p className="text-white/90 mb-4 line-clamp-2">
              {getExcerpt()}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={blog.profiles.avatar_url} />
                  <AvatarFallback>
                    {blog.profiles.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {blog.profiles.full_name || blog.profiles.username}
                  </p>
                  <div className="flex items-center text-xs text-white/70 space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(publishedDate), { addSuffix: true })}</span>
                    <Clock className="h-3 w-3 ml-2" />
                    <span>{readingTime} min read</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="group border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {blog.featured_image && (
              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                <img
                  src={blog.featured_image}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                <Link to={`/blog/${blog.slug}`}>
                  {blog.title}
                </Link>
              </h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {getExcerpt()}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{blog.profiles.username}</span>
                <div className="flex items-center space-x-2">
                  <Eye className="h-3 w-3" />
                  <span>{blog.view_count}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 h-full">
      {blog.featured_image && (
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={blog.featured_image}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <CardContent className="p-6">
        {blog.categories && (
          <Badge variant="secondary" className="mb-3">
            {blog.categories.name}
          </Badge>
        )}
        
        <h3 className="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          <Link to={`/blog/${blog.slug}`}>
            {blog.title}
          </Link>
        </h3>
        
        <p className="text-muted-foreground mb-4 line-clamp-3">
          {getExcerpt()}
        </p>

        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={blog.profiles.avatar_url} />
            <AvatarFallback>
              {blog.profiles.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {blog.profiles.full_name || blog.profiles.username}
            </p>
            <div className="flex items-center text-xs text-muted-foreground space-x-2">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(publishedDate), { addSuffix: true })}</span>
              <Clock className="h-3 w-3 ml-2" />
              <span>{readingTime} min read</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 py-3 bg-muted/20 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span>{blog.view_count}</span>
          </div>
          {blog._count && (
            <>
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{blog._count.likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{blog._count.comments}</span>
              </div>
            </>
          )}
        </div>
        
        {showActions && (
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/blog/${blog.slug}`}>
              Read more
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default BlogCard;