-- Create notification_channels table for user communication preferences
CREATE TABLE public.notification_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'sms', 'push', 'in_app')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel_type)
);

-- Enable RLS
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;

-- Create policies for notification channels
CREATE POLICY "Users can manage their own notification channels"
ON public.notification_channels
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all notification channels"
ON public.notification_channels
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Create return_rules table for vendor return policies
CREATE TABLE public.return_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('time_limit', 'condition', 'category_restriction', 'refund_policy')),
  parameters JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.return_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for return rules
CREATE POLICY "Vendors can manage their own return rules"
ON public.return_rules
FOR ALL
USING (is_vendor_owner(vendor_id, auth.uid()))
WITH CHECK (is_vendor_owner(vendor_id, auth.uid()));

CREATE POLICY "Public can view active return rules"
ON public.return_rules
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all return rules"
ON public.return_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_notification_channels_updated_at
BEFORE UPDATE ON public.notification_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_return_rules_updated_at
BEFORE UPDATE ON public.return_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();