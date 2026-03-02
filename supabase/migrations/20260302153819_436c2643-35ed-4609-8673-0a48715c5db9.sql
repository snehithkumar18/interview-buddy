CREATE POLICY "Authenticated can check admin status"
ON public.admin_users
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = email);