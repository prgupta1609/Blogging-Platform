import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Eye, 
  Save, 
  Send, 
  Rocket, 
  FileText, 
  Clock, 
  CheckCircle,
  Sparkles,
  TrendingUp,
  Shield,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MDEditor from '@uiw/react-md-editor';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const WriteBlog = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogData, setBlogData] = useState({
    title: '',
    content: '',
    excerpt: '',
    categoryId: '',
    featuredImage: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'pending' | 'submitted'
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const generateExcerpt = (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    if (!profile) {
      toast({
        variant: 'destructive',
        title: 'Profile not found',
        description: 'Please complete your profile setup'
      });
      return;
    }

    if (!blogData.title.trim() || !blogData.content.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing required fields',
        description: 'Please provide both title and content'
      });
      return;
    }

    try {
      setSaving(true);
      
      const slug = generateSlug(blogData.title);
      const excerpt = blogData.excerpt || generateExcerpt(blogData.content);
      
      const insertData = {
        title: blogData.title,
        content: blogData.content,
        excerpt,
        slug,
        featured_image: blogData.featuredImage || null,
        author_id: profile.id,
        category_id: blogData.categoryId || null,
        tags: blogData.tags.length > 0 ? blogData.tags : null,
        status: status === 'draft' ? 'draft' : 'pending',
        submitted_at: status === 'submitted' ? new Date().toISOString() : null,
        published_at: null
      };

      const { data, error } = await supabase
        .from('blogs')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      if (status === 'submitted') {
        toast({
          title: '🎉 Blog Submitted Successfully!',
          description: `"${blogData.title}" has been submitted for admin review. You'll be notified when it's approved or rejected.`,
          duration: 5000,
        });
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Blog Submitted!', {
            body: `"${blogData.title}" is now pending admin review.`,
            icon: '/favicon.ico'
          });
        }
      } else {
        toast({
          title: '💾 Draft Saved!',
          description: `Your blog has been saved as a draft with URL: /blog/${slug}`
        });
      }

      navigate('/profile?tab=blogs');
    } catch (error: any) {
      let errorMessage = error.message;
      
      if (error.code === '23505' && error.constraint === 'blogs_slug_key') {
        errorMessage = 'A blog with this title already exists. Please try a different title.';
      } else if (error.code === '23505') {
        errorMessage = 'This blog post conflicts with an existing one. Please check your input.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Error saving blog',
        description: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-slate-300" />
              <h1 className="text-xl font-semibold text-slate-900">Create New Blog</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Write a New Blog
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Share your story with the world • All content requires admin approval for quality control
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="flex-1 sm:flex-none px-8 py-3 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
              >
                <Save className="h-5 w-5 mr-3" />
                Save Draft
              </Button>
              <Button
                onClick={() => setShowSubmitModal(true)}
                disabled={saving}
                variant="default"
                className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Send className="h-5 w-5 mr-3" />
                Submit for Review
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowPublishModal(true)}
                disabled={saving}
                className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Rocket className="h-5 w-5 mr-3" />
                Submit for Admin Review
              </Button>
            </div>

            {/* Explanation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Save className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Save Draft</h3>
                </div>
                <p className="text-sm text-slate-600">Save your work privately for later editing and refinement.</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Send className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Submit for Review</h3>
                </div>
                <p className="text-sm text-slate-600">Submit for standard admin review process and feedback.</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Rocket className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Admin Review</h3>
                </div>
                <p className="text-sm text-slate-600">Submit for admin approval before publishing (required for all content).</p>
              </div>
            </div>

            {previewMode ? (
              /* Preview Mode */
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="space-y-4">
                    {blogData.featuredImage && (
                      <div className="relative">
                        <img
                          src={blogData.featuredImage}
                          alt={blogData.title}
                          className="w-full h-64 object-cover rounded-xl shadow-lg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
                      </div>
                    )}
                    <div className="space-y-3">
                      {blogData.categoryId && (
                        <Badge variant="secondary" className="px-3 py-1 text-sm">
                          {categories.find(c => c.id === blogData.categoryId)?.name}
                        </Badge>
                      )}
                      <h1 className="text-3xl font-bold text-slate-900">{blogData.title || 'Your Blog Title'}</h1>
                      {blogData.excerpt && (
                        <p className="text-lg text-slate-600 leading-relaxed">{blogData.excerpt}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div data-color-mode="light" className="prose prose-slate max-w-none">
                    <MDEditor.Markdown source={blogData.content || 'Your blog content will appear here...'} />
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Edit Mode */
              <div className="space-y-6">
                {/* Basic Information */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-slate-900">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span>Blog Details</span>
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Fill in the essential information for your blog post
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-slate-700 font-medium">Title *</Label>
                        <Input
                          id="title"
                          placeholder="Enter your blog title"
                          value={blogData.title}
                          onChange={(e) => setBlogData(prev => ({ ...prev, title: e.target.value }))}
                          className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 transition-colors duration-200"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-slate-700 font-medium">Category</Label>
                        <Select
                          value={blogData.categoryId}
                          onValueChange={(value) => setBlogData(prev => ({ ...prev, categoryId: value }))}
                        >
                          <SelectTrigger className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="excerpt" className="text-slate-700 font-medium">Excerpt (Optional)</Label>
                      <Input
                        id="excerpt"
                        placeholder="A brief summary of your blog post"
                        value={blogData.excerpt}
                        onChange={(e) => setBlogData(prev => ({ ...prev, excerpt: e.target.value }))}
                        className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 transition-colors duration-200"
                      />
                      <p className="text-xs text-slate-500">This will appear as a preview in blog listings</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="featuredImage" className="text-slate-700 font-medium">Featured Image URL (Optional)</Label>
                      <Input
                        id="featuredImage"
                        placeholder="https://example.com/image.jpg"
                        value={blogData.featuredImage}
                        onChange={(e) => setBlogData(prev => ({ ...prev, featuredImage: e.target.value }))}
                        className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 transition-colors duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags" className="text-slate-700 font-medium">Tags (Optional)</Label>
                      <div className="space-y-2">
                        <Input
                          id="tags"
                          placeholder="Type a tag and press Enter (e.g., technology, programming, tips)"
                          value=""
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const target = e.target as HTMLInputElement;
                              const tag = target.value.trim().toLowerCase();
                              if (tag && !blogData.tags.includes(tag)) {
                                setBlogData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                                target.value = '';
                              }
                            }
                          }}
                          className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 transition-colors duration-200"
                        />
                        {blogData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {blogData.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors duration-200 px-3 py-1"
                                onClick={() => setBlogData(prev => ({ 
                                  ...prev, 
                                  tags: prev.tags.filter((_, i) => i !== index) 
                                }))}
                              >
                                {tag} ×
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-slate-500">
                          Tags help readers discover your content. Use relevant keywords separated by commas.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Editor */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-slate-900">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <span>Blog Content</span>
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Write your blog content using the markdown editor below
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <MDEditor
                        value={blogData.content}
                        onChange={(value) => setBlogData(prev => ({ ...prev, content: value || '' }))}
                        height={500}
                        preview="edit"
                        className="border-0"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Publishing Options */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-slate-900">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  <span>Publishing Options</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Choose how you want to submit your blog
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <h4 className="font-semibold mb-2 text-blue-800 flex items-center">
                        <Rocket className="h-4 w-4 mr-2" />
                        Submit for Admin Review
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-2 text-blue-600" />
                          Your blog is submitted for admin approval
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-2 text-blue-600" />
                          Quality review before publishing
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-2 text-blue-600" />
                          Ensures content meets standards
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-2 text-blue-600" />
                          You'll be notified of approval status
                        </li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                      <h4 className="font-semibold mb-2 text-amber-800 flex items-center">
                        <Send className="h-4 w-4 mr-2" />
                        Submit for Review
                      </h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-2 text-amber-600" />
                          Your blog is reviewed by our team
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-2 text-amber-600" />
                          Quality assurance and feedback
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-2 text-amber-600" />
                          Great for new writers
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-2 text-amber-600" />
                          You'll be notified of the status
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-xl">
                    <h4 className="font-semibold mb-2 text-slate-800 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Quality Assurance
                    </h4>
                    <p className="text-sm text-slate-600">
                      All content requires admin approval for quality control. This ensures our platform maintains high standards and provides valuable content to readers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-purple-900">
                  <TrendingUp className="h-5 w-5" />
                  <span>Platform Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">Total Blogs</span>
                    <span className="text-lg font-semibold text-purple-900">1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">Active Writers</span>
                    <span className="text-lg font-semibold text-purple-900">89</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">Avg. Review Time</span>
                    <span className="text-lg font-semibold text-purple-900">24h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <Send className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Submit Blog for Review</h3>
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to submit "{blogData.title}" for admin review? 
                Once submitted, you won't be able to edit it until it's reviewed.
              </p>
            </div>
            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 h-12 border-slate-300 hover:border-slate-400"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowSubmitModal(false);
                  handleSave('submitted');
                }}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Review Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Submit for Admin Review</h3>
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to submit "{blogData.title}" for admin review? 
                This will submit your blog for approval before it can be published and visible to readers.
              </p>
            </div>
            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => setShowPublishModal(false)}
                className="flex-1 h-12 border-slate-300 hover:border-slate-400"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowPublishModal(false);
                  handleSave('submitted');
                }}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                disabled={loading}
                variant="default"
              >
                {loading ? 'Submitting...' : '📝 Submit for Review'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WriteBlog;