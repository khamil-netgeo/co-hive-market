import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReturnRule {
  id: string;
  vendor_id: string;
  product_category?: string;
  days_limit: number;
  auto_approve_under_amount: number;
  requires_photos: boolean;
  return_reasons: string[];
  processing_time_hours: number;
  created_at: string;
}

interface ReturnRequest {
  id: string;
  order_id: string;
  order_item_id?: string;
  buyer_user_id: string;
  vendor_id: string;
  status: 'requested' | 'approved' | 'rejected' | 'processing' | 'completed';
  reason: string;
  description?: string;
  refund_amount_cents: number;
  currency: string;
  photos?: string[];
  created_at: string;
  updated_at: string;
}

export function useReturnAutomation() {
  const [isLoading, setIsLoading] = useState(false);

  // Create return rule for vendor
  const createReturnRule = useCallback(async (rule: Omit<ReturnRule, 'id' | 'created_at'>) => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get vendor ID for current user
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendor) throw new Error('Vendor not found');

      const { data, error } = await supabase
        .from('return_rules')
        .insert({
          vendor_id: vendor.id,
          rule_type: 'time_limit',
          parameters: {
            days_limit: rule.days_limit,
            auto_approve_under_amount: rule.auto_approve_under_amount,
            requires_photos: rule.requires_photos,
            return_reasons: rule.return_reasons,
            processing_time_hours: rule.processing_time_hours
          },
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      const newRule = {
        id: data.id,
        vendor_id: data.vendor_id,
        ...rule,
        created_at: data.created_at
      };
      
      console.log('Return rule created:', newRule);
      toast.success('Return rule created successfully');
      return newRule;
    } catch (error) {
      console.error('Failed to create return rule:', error);
      toast.error('Failed to create return rule');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Process return request automatically
  const processReturnRequest = useCallback(async (requestId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('process-return-request', {
        body: { request_id: requestId }
      });

      if (error) throw error;
      
      toast.success('Return request processed successfully');
      return data;
    } catch (error) {
      console.error('Failed to process return request:', error);
      toast.error('Failed to process return request');
      return null;
    }
  }, []);

  // Submit return request from buyer
  const submitReturnRequest = useCallback(async (
    orderId: string,
    reason: string,
    description?: string,
    photos?: File[]
  ) => {
    try {
      setIsLoading(true);

      // Upload photos if provided
      let photoUrls: string[] = [];
      if (photos && photos.length > 0) {
        for (const photo of photos) {
          const fileName = `return-${orderId}-${Date.now()}-${photo.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('return-photos')
            .upload(fileName, photo);

          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabase.storage
            .from('return-photos')
            .getPublicUrl(uploadData.path);
          
          photoUrls.push(urlData.publicUrl);
        }
      }

      const { data, error } = await supabase.functions.invoke('submit-return-request', {
        body: {
          order_id: orderId,
          reason,
          description,
          photos: photoUrls
        }
      });

      if (error) throw error;
      
      toast.success('Return request submitted successfully');
      return data;
    } catch (error) {
      console.error('Failed to submit return request:', error);
      toast.error('Failed to submit return request');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update return request status
  const updateReturnStatus = useCallback(async (
    requestId: string,
    status: string,
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('order_return_requests')
        .update({
          status: status as any,
          updated_at: new Date().toISOString(),
          ...(notes && { vendor_notes: notes })
        })
        .eq('id', requestId);

      if (error) throw error;
      
      toast.success('Return status updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update return status:', error);
      toast.error('Failed to update return status');
      return false;
    }
  }, []);

  // Get return eligibility for order
  const checkReturnEligibility = useCallback(async (orderId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-return-eligibility', {
        body: { order_id: orderId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to check return eligibility:', error);
      return { eligible: false, reason: 'Error checking eligibility' };
    }
  }, []);

  // Process refund
  const processRefund = useCallback(async (requestId: string, amount: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          request_id: requestId,
          amount_cents: Math.round(amount * 100)
        }
      });

      if (error) throw error;
      
      toast.success('Refund processed successfully');
      return data;
    } catch (error) {
      console.error('Failed to process refund:', error);
      toast.error('Failed to process refund');
      return null;
    }
  }, []);

  return {
    isLoading,
    createReturnRule,
    processReturnRequest,
    submitReturnRequest,
    updateReturnStatus,
    checkReturnEligibility,
    processRefund
  };
}