-- WealthOS Migration 012: Revoke EXECUTE privileges on trigger and helper functions
-- Description: Hardens DB security by explicitly revoking EXECUTE from anon, authenticated, and PUBLIC roles.

DO $$
BEGIN
    -- 1. handle_new_user()
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
    ) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;';
    END IF;

    -- 2. handle_new_user_targets()
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'handle_new_user_targets'
    ) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_new_user_targets() FROM PUBLIC, anon, authenticated;';
    END IF;

    -- 3. set_updated_at()
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'set_updated_at'
    ) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;';
    END IF;

    -- 4. update_updated_at()
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_updated_at'
    ) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;';
    END IF;

    -- 5. create_sandbox_wallet()
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'create_sandbox_wallet'
    ) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.create_sandbox_wallet() FROM PUBLIC, anon, authenticated;';
    END IF;

    -- 6. sync_holding_prices(uuid)
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'sync_holding_prices'
    ) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.sync_holding_prices(uuid) FROM PUBLIC, anon, authenticated;';
    END IF;
END $$;
