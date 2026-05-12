import { useState, useEffect } from 'react';
import { CheckCircle, X, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { SimulatorInputs } from '../lib/calculator';

interface Props {
  inputs: SimulatorInputs;
}

const TIME_OPTIONS = [
  '오전 9시 ~ 11시',
  '오전 11시 ~ 오후 1시',
  '오후 1시 ~ 3시',
  '오후 3시 ~ 5시',
  '오후 5시 ~ 7시',
];

/**
 * @copyright 2026 Designed & Developed by 이기적인 은퇴설계
 */

export default function ConsultationForm({ inputs }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [location, setLocation] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  // 보안 로직
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'u' || e.key === 's' || e.key === 'i')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const formatPhoneNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 11) return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    if (cleaned.length === 10) return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    return cleaned;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim() || !birthDate.trim() || !preferredTime || !location.trim()) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    if (!agreed) {
      setError('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }
    
    setError('');
    setLoading(true);
    const formattedPhone = formatPhoneNumber(phone.trim());

    try {
      await fetch("https://script.google.com/macros/s/AKfycbw4x5GIMcKcWC9PSmhgiEGmQLUSUN6K6lBe64K4KH2qvI6Cfabglr4gUehN1Xvo-rvCeA/exec", {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          name: name.trim(),
          birthDate: birthDate.trim(),
          phone: formattedPhone,
          time: preferredTime,
          location: location.trim(),
          source: '이기적인 은퇴설계'
        }),
      });

      await supabase.from('consultations').insert({
        name: name.trim(),
        phone: formattedPhone,
        preferred_time: preferredTime,
        current_age: inputs.currentAge,
      });
      
      setShowSuccess(true);
      setName(''); setPhone(''); setBirthDate(''); setLocation(''); setAgreed(false); setPreferredTime('');

    } catch (err) {
      setError('접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 select-none">
        <div className="mb-5 border-b border-slate-50 pb-4">
          <span className="inline-block bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full mb-3 tracking-wider uppercase">무료 상담 신청</span>
          {/* 제목 멘트 수정 */}
          <h2 className="text-[17px] font-extrabold text-slate-900 leading-snug">
            나만을 위한 특별한 전략<br />
            <span className="text-blue-500">이기적인 은퇴설계 신청하기</span>
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">생년월일</label>
              <input type="text" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} placeholder="850101" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">연락처</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">상담 지역</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="예: 서울 강남구" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase">상담 희망 시간</label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_OPTIONS.map((t) => (
                <button key={t} type="button" onClick={() => setPreferredTime(t)} className={`rounded-xl border px-3 py-2.5 text-[11px] font-semibold transition-all ${preferredTime === t ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 py-2">
            <input type="checkbox" id="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-500" />
            <label htmlFor="agree" className="text-[11px] text-slate-500 leading-snug cursor-pointer">
              (필수) 개인정보 수집 및 이용에 동의합니다. <br/>
              <span className="text-[10px] text-slate-400">상담 목적 이외에 사용되지 않습니다.</span>
            </label>
          </div>

          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold text-sm rounded-2xl py-4 transition-all shadow-lg shadow-blue-200">
            {loading ? '접수 중...' : '이기적인 은퇴설계 상담 신청'}
          </button>
        </form>

        {/* 저작권 표시 수정 완료 */}
        <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-center gap-1.5 opacity-60">
          <ShieldAlert size={12} className="text-slate-400" />
          <p className="text-[10px] text-slate-400 font-medium tracking-tight">
            Designed by <span className="font-bold">이기적인 은퇴설계</span> | ⓒ 2026 All rights reserved.
          </p>
        </div>
      </section>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center relative border border-slate-100">
            <button onClick={() => setShowSuccess(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">접수가 완료되었습니다</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              남다른 노후를 위한 첫 걸음,<br />전문가가 곧 연락드리겠습니다.
            </p>
            <button onClick={() => setShowSuccess(false)} className="mt-6 w-full bg-blue-500 text-white font-bold rounded-2xl py-3.5 text-sm hover:bg-blue-600 shadow-md shadow-blue-100 transition">
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}