import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL
) as string | undefined;

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
) as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// 브라우저 콘솔에서 즉시 연결 상태를 확인할 수 있는 진단 로그
if (typeof window !== 'undefined') {
  if (isSupabaseConfigured) {
    console.info(
      '%c[숙명클라라피아노] Supabase 실시간 클라우드 DB에 성공적으로 연결되었습니다!',
      'color: #34c759; font-weight: bold; font-size: 12px;',
      `URL: ${supabaseUrl}`
    );
  } else {
    console.warn(
      '%c[숙명클라라피아노] 현재 로컬 스토리지 모드로 실행 중입니다.\n' +
      'Vercel 대시보드 > Project Settings > Environment Variables에 아래 변수가 설정되었는지 확인 후 [Redeploy] 해주세요:\n' +
      '- VITE_SUPABASE_URL\n' +
      '- VITE_SUPABASE_ANON_KEY',
      'color: #f59e0b; font-weight: bold; font-size: 12px;'
    );
  }
}
