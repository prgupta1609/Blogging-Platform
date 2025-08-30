import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reply, Heart, Trash2, Edit, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  replies?: Comment[];
  is_editing?: boolean;
}

interface CommentsProps {
  blogId: string;
  onCommentCountChange?: (count: number) => void;
}

const Comments = ({ blogId, onCommentCountChange }: CommentsProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [blogId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          *,
          author:author_id(id, username, full_name, avatar_url)
        `)
        .eq('blog_id', blogId)
        .eq('parent_id', null)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: replies } = await supabase
            .from('blog_comments')
            .select(`
              *,
              author:author_id(id, username, full_name, avatar_url)
            `)
            .eq('parent_id', comment.id)
            .eq('is_approved', true)
            .order('created_at', { ascending: true });

          return {
            ...comment,
            replies: replies || []
          };
        })
      );

      setComments(commentsWithReplies);
      onCommentCountChange?.(commentsWithReplies.length);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading comments',
        description: error.message
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!profile || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('blog_comments')
        .insert({
          blog_id: blogId,
          author_id: profile.id,
          content: newComment.trim(),
          parent_id: null
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
      
      toast({
        title: 'Comment posted!',
        description: 'Your comment has been added successfully.'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error posting comment',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!profile || !replyContent.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('blog_comments')
        .insert({
          blog_id: blogId,
          author_id: profile.id,
          content: replyContent.trim(),
          parent_id: parentId
        });

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      await fetchComments();
      
      toast({
        title: 'Reply posted!',
        description: 'Your reply has been added successfully.'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error posting reply',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('blog_comments')
        .update({ content: editContent.trim() })
        .eq('id', commentId);

      if (error) throw error;

      setEditingComment(null);
      setEditContent('');
      await fetchComments();
      
      toast({
        title: 'Comment updated!',
        description: 'Your comment has been updated successfully.'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating comment',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments();
      
      toast({
        title: 'Comment deleted!',
        description: 'Your comment has been removed successfully.'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting comment',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <Card key={comment.id} className={`mb-4 ${isReply ? 'ml-8 border-l-2 border-muted' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author.avatar_url} />
            <AvatarFallback className="text-xs">
              {comment.author.full_name?.[0]?.toUpperCase() || comment.author.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm">
                {comment.author.full_name || comment.author.username}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {comment.updated_at !== comment.created_at && (
                <Badge variant="outline" className="text-xs">Edited</Badge>
              )}
            </div>
            
            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your comment..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment.id)}
                    disabled={loading}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Update
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {comment.content}
              </p>
            )}
            
            {!isReply && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="h-7 px-2 text-xs"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                
                {profile?.id === comment.author.id && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(comment)}
                      className="h-7 px-2 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            )}
            
            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={loading}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-2">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Comments ({comments.length})</h3>
      
      {/* Add new comment */}
      {user && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {profile?.full_name?.[0]?.toUpperCase() || profile?.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={loading || !newComment.trim()}
                    size="sm"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(renderComment)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Comments;
