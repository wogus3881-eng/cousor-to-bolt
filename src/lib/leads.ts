import { supabase } from './supabase';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  preferred_time: string;
  location: string | null;
  current_age: number | null;
  retirement_age: number | null;
  annual_salary: number | null;
  monthly_expense: number | null;
  created_at: string;
}

/** 로그인한 설계사 본인의 고객용 링크(agent_id)로 들어온 상담 신청만 가져옵니다.
 *  RLS 정책이 본인 것만 반환하도록 서버에서 걸러줍니다. */
export async function getMyLeads(): Promise<Lead[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('consultations')
    .select('id, name, phone, preferred_time, location, current_age, retirement_age, annual_salary, monthly_expense, created_at')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}
