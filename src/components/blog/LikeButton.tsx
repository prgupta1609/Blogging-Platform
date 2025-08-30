import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LikeButtonProps {
  blogId: string;
  initialLikes?: number;
  onLikeCountChange?: (count: number) => void;
  size?: 'sm' | 'default' | 'lg';
}

const LikeButton = ({ blogId, initialLikes = 0, onLikeCountChange, size = 'default' }: LikeButtonProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && profile) {
      checkIfLiked();
    }
  }, [user, profile, blogId]);

  const checkIfLiked = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_likes')
        .select('id')
        .eq('blog_id', blogId)
        .eq('user_id', profile?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking like status:', error);
        return;
      }

      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!user || !profile) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'Please sign in to like this blog.'
      });
      return;
    }

    setLoading(true);
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('blog_likes')
          .delete()
          .eq('blog_id', blogId)
          .eq('user_id', profile.id);

        if (error) throw error;

        setIsLiked(false);
        const newCount = likeCount - 1;
        setLikeCount(newCount);
        onLikeCountChange?.(newCount);
        
        toast({
          title: 'Like removed',
          description: 'You unliked this blog.'
        });
      } else {
        // Like
        const { error } = await supabase
          .from('blog_likes')
          .insert({
            blog_id: blogId,
            user_id: profile.id
          });

        if (error) throw error;

        setIsLiked(true);
        const newCount = likeCount + 1;
        setLikeCount(newCount);
        onLikeCountChange?.(newCount);
        
        toast({
          title: 'Blog liked!',
          description: 'Thanks for showing your appreciation!'
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating like',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-10 w-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-6 w-6';
      default:
        return 'h-5 w-5';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isLiked ? "default" : "outline"}
        size="icon"
        onClick={handleLike}
        disabled={loading}
        className={`${getButtonSize()} ${isLiked ? 'bg-red-500 hover:bg-red-600' : ''}`}
        aria-label={isLiked ? 'Unlike this blog' : 'Like this blog'}
      >
        <Heart 
          className={`${getIconSize()} ${isLiked ? 'fill-current' : ''}`} 
        />
      </Button>
      
      <span className="text-sm font-medium text-muted-foreground">
        {likeCount} {likeCount === 1 ? 'like' : 'likes'}
      </span>
    </div>
  );
};

export default LikeButton;
