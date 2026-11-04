-- Custom SQL migration: create a public.users profile row whenever Supabase
-- Auth creates a user in auth.users. Because it runs inside the same insert,
-- signup and profile creation succeed or fail together.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
-- Runs with the function owner's rights, since Supabase Auth's own database
-- role can't write to our tables. The empty search_path forces every name
-- below to be schema-qualified, so nothing can be hijacked via search_path.
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    -- Name from signup metadata; fall back to the part of the email before @.
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      SPLIT_PART(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;
--> statement-breakpoint

-- Only the trigger should call this, never a client through Supabase's API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
