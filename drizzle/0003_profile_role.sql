-- Custom SQL migration: the profile trigger now also copies the role chosen at
-- signup. Signup metadata is user-controlled, so anything other than exactly
-- 'coach' becomes 'athlete'. Being a coach grants no access by itself: a coach
-- only sees athletes who have added them.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    CASE
      WHEN NEW.raw_user_meta_data ->> 'role' = 'coach' THEN 'coach'::public.role
      ELSE 'athlete'::public.role
    END
  );
  RETURN NEW;
END;
$$;
--> statement-breakpoint

-- CREATE OR REPLACE keeps the existing grants, but restate the revoke so this
-- file is correct on its own.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
