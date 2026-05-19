import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function BlockedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <ShieldAlert size={28} className="text-red-500" />
        </div>
        <h1 className="text-lg font-extrabold text-slate-900">접근 권한이 없습니다.</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          담당 설계사에게 문의해 주세요.
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          Pro는 설계사가 전달한 링크(<span className="font-mono">?code=코드</span>)로 접속해야 합니다.
        </p>
        <Link
          to="/v2"
          className="mt-6 inline-block rounded-2xl bg-navy-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-navy-700"
        >
          고객용 진단으로 이동
        </Link>
      </div>
    </div>
  );
}
