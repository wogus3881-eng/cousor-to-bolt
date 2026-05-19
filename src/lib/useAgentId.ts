import { useSearchParams } from 'react-router-dom';

/** URL 쿼리 `?agent=abc123` 에서 설계사 ID를 읽습니다. */
export function useAgentId(): string | null {
  const [searchParams] = useSearchParams();
  return searchParams.get('agent');
}
