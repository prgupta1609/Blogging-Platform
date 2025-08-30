-- Add social features: likes, comments, and enhanced content management

-- Create likes table for blog interactions
CREATE TABLE IF NOT EXISTS public.blog_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blog_id, user_id)
);

-- Create comments table for blog discussions
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add is_hidden column to blogs table for content management
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Add tags column to blogs table for better categorization
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create blog_views table for detailed analytics
CREATE TABLE IF NOT EXISTS public.blog_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id),
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_analytics table for performance metrics
CREATE TABLE IF NOT EXISTS public.blog_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  UNIQUE(blog_id, date)
);

-- Enable RLS on new tables
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_likes
CREATE POLICY "Likes are viewable by everyone" ON public.blog_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON public.blog_likes
  FOR ALL USING (user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- RLS Policies for blog_comments
CREATE POLICY "Comments are viewable by everyone" ON public.blog_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON public.blog_comments
  FOR INSERT WITH CHECK (author_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own comments" ON public.blog_comments
  FOR UPDATE USING (author_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own comments or admins can delete any" ON public.blog_comments
  FOR DELETE USING (
    author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

-- RLS Policies for blog_views
CREATE POLICY "Views are viewable by blog authors and admins" ON public.blog_views
  FOR SELECT USING (
    blog_id IN (
      SELECT id FROM public.blogs 
      WHERE author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    ) OR public.is_admin(auth.uid())
  );

CREATE POLICY "Anyone can insert views" ON public.blog_views
  FOR INSERT WITH CHECK (true);

-- RLS Policies for blog_analytics
CREATE POLICY "Analytics viewable by blog authors and admins" ON public.blog_analytics
  FOR SELECT USING (
    blog_id IN (
      SELECT id FROM public.blogs 
      WHERE author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    ) OR public.is_admin(auth.uid())
  );

-- Create function to update blog analytics
CREATE OR REPLACE FUNCTION public.update_blog_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert analytics for the current date
  INSERT INTO public.blog_analytics (blog_id, date, views, likes, comments)
  VALUES (
    NEW.blog_id,
    CURRENT_DATE,
    (SELECT COUNT(*) FROM public.blog_views WHERE blog_id = NEW.blog_id AND DATE(viewed_at) = CURRENT_DATE),
    (SELECT COUNT(*) FROM public.blog_likes WHERE blog_id = NEW.blog_id),
    (SELECT COUNT(*) FROM public.blog_comments WHERE blog_id = NEW.blog_id AND is_approved = true)
  )
  ON CONFLICT (blog_id, date)
  DO UPDATE SET
    views = EXCLUDED.views,
    likes = EXCLUDED.likes,
    comments = EXCLUDED.comments;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for analytics updates
CREATE TRIGGER update_analytics_on_like
  AFTER INSERT OR DELETE ON public.blog_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_analytics();

CREATE TRIGGER update_analytics_on_comment
  AFTER INSERT OR DELETE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_analytics();

CREATE TRIGGER update_analytics_on_view
  AFTER INSERT ON public.blog_views
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_analytics();

-- Create function to get trending blogs
CREATE OR REPLACE FUNCTION public.get_trending_blogs(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  blog_id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  featured_image TEXT,
  author_name TEXT,
  author_username TEXT,
  category_name TEXT,
  total_engagement BIGINT,
  views_today INTEGER,
  likes_count BIGINT,
  comments_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.slug,
    b.excerpt,
    b.featured_image,
    p.full_name,
    p.username,
    c.name as category_name,
    COALESCE(bl.likes_count, 0) + COALESCE(bc.comments_count, 0) as total_engagement,
    COALESCE(bv.views_today, 0) as views_today,
    COALESCE(bl.likes_count, 0) as likes_count,
    COALESCE(bc.comments_count, 0) as comments_count,
    b.created_at
  FROM public.blogs b
  LEFT JOIN public.profiles p ON b.author_id = p.id
  LEFT JOIN public.categories c ON b.category_id = c.id
  LEFT JOIN (
    SELECT blog_id, COUNT(*) as likes_count
    FROM public.blog_likes
    GROUP BY blog_id
  ) bl ON b.id = bl.blog_id
  LEFT JOIN (
    SELECT blog_id, COUNT(*) as comments_count
    FROM public.blog_comments
    WHERE is_approved = true
    GROUP BY blog_id
  ) bc ON b.id = bc.blog_id
  LEFT JOIN (
    SELECT blog_id, COUNT(*) as views_today
    FROM public.blog_views
    WHERE DATE(viewed_at) = CURRENT_DATE
    GROUP BY blog_id
  ) bv ON b.id = bv.blog_id
  WHERE b.status = 'approved' 
    AND b.is_hidden = false
    AND b.published_at IS NOT NULL
  ORDER BY total_engagement DESC, views_today DESC, b.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_likes_blog_id ON public.blog_likes(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_user_id ON public.blog_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_blog_id ON public.blog_comments(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_author_id ON public.blog_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON public.blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_blog_id ON public.blog_views(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_date ON public.blog_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_blogs_tags ON public.blogs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blogs_hidden ON public.blogs(is_hidden) WHERE is_hidden = false;
