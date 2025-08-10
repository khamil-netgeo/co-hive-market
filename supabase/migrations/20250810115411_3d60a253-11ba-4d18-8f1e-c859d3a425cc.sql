-- Migration: Adjust trigger functions to SECURITY INVOKER (keep RLS helper functions as SECURITY DEFINER)
-- Reason: Reduce linter warnings; triggers don't need elevated privileges

-- 1) Chat message trigger: update thread metadata as the participant (RLS allows it)
CREATE OR REPLACE FUNCTION public.on_chat_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.chat_threads
  SET last_message_at = NOW(),
      last_message_preview = COALESCE(LEFT(NEW.body, 160), last_message_preview),
      updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$function$;

-- 2) Support message trigger: update ticket timestamp as the participant/admin
-- (Table definition/policies assumed existing from prior migration)
CREATE OR REPLACE FUNCTION public.on_support_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.support_tickets
  SET updated_at = NOW()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$function$;

-- 3) Generic updated_at helpers should not need SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;