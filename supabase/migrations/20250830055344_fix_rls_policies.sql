-- Fix RLS policies to allow users to delete their own blogs
-- Drop the existing delete policy that only allows admins
DROP POLICY IF EXISTS "Admins can delete any blog" ON public.blogs;

-- Create new delete policy that allows users to delete their own blogs OR admins to delete any
CREATE POLICY "Users can delete their own blogs or admins can delete any" ON public.blogs
  FOR DELETE USING (
    author_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) OR public.is_admin(auth.uid())
  );

-- Add a policy to allow users to update their own blogs (including status changes)
-- This was missing and is needed for the submit for review functionality
CREATE POLICY "Users can update their own blogs" ON public.blogs
  FOR UPDATE USING (
    author_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) OR public.is_admin(auth.uid())
  );

-- Ensure the existing update policy is properly set
-- (The original migration had this but let's make sure it's correct)
DROP POLICY IF EXISTS "Users can update their own blogs" ON public.blogs;
CREATE POLICY "Users can update their own blogs" ON public.blogs
  FOR UPDATE USING (
    author_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) OR public.is_admin(auth.uid())
  );
