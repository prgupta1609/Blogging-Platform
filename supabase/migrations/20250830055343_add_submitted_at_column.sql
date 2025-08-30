-- Add submitted_at column to blogs table
ALTER TABLE public.blogs 
ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE;

-- Update existing blogs to have submitted_at set to created_at for blogs with status 'pending' or 'approved'
UPDATE public.blogs 
SET submitted_at = created_at 
WHERE status IN ('pending', 'approved') AND submitted_at IS NULL;

-- Update existing blogs to have submitted_at set to NULL for drafts
UPDATE public.blogs 
SET submitted_at = NULL 
WHERE status = 'draft' AND submitted_at IS NOT NULL;


