import { supabase } from "@/integrations/supabase/client";

export type RateQuery = {
  pick_postcode: string;
  pick_state?: string;
  pick_country?: string;
  send_postcode: string;
  send_state?: string;
  send_country?: string;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  domestic?: boolean;
  cod?: boolean;
};

export async function fetchEasyParcelRates(params: RateQuery) {
  const { data, error } = await supabase.functions.invoke("easyparcel-rates", {
    body: params,
  });
  if (error) throw error;
  return data;
}

export async function createEasyParcelShipment(bulk: any[]) {
  const { data, error } = await supabase.functions.invoke("easyparcel-create", {
    body: { bulk },
  });
  if (error) throw error;
  return data;
}

export async function trackEasyParcel(input: { awb_no?: string | string[]; order_no?: string | string[] }) {
  const { data, error } = await supabase.functions.invoke("easyparcel-track", {
    body: input,
  });
  if (error) throw error;
  return data;
}
