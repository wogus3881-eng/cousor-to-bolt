import { useState, useEffect } from 'react';
import { CheckCircle, X, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { buildConsultationReportPdfBlob, uploadConsultationReportPdf } from '../lib/consultationReportPdf';
import type { SimulationResult, SimulatorInputs } from '../lib/calculator';

interface Props {
  inputs: SimulatorInputs;
  /** 있으면 상담 신청 시 PDF 생성 후 Storage URL 저장 */
  simulationResult?: SimulationResult | null;
}

const TIME_OPTIONS = [
  '오전 9시 ~ 11시',
  '오전 11시 ~ 오후 1시',
  '오후 1시 ~ 3시',
  '오후 3시 ~ 5시',
  '오후 5시 ~ 7시',
];

/** 웹앱 배포 URL (배포 ID = /macros/s/ 와 /exec 사이) */
const GOOGLE_SHEET_WEBAPP_EXEC =
  'https://script.google.com/macros/s/AKfycbyWWLcp84IIMZKT4Ev8uqZ1Z071ZloDuQXiZhoIgvb9LvizwkMjSHT0aPD0pp7C3x37NA/exec';

/**
 * fetch + no-cors 는 환경에 따라 POST 본문이 누락될 수 있음.
 * 숨은 iframe + form POST 는 브라우저 기본 제출이라 Apps Script 의 e.parameter 로 안정적으로 들어감.
 */
function postConsultationToGoogleScript(fields: Record<string, string>) {
  const frameName = `gas-embed-${Date.now()}`;
  const iframe = document.createElement('iframe');
  iframe.name = frameName;
  iframe.title = 'google-apps-script-submit';
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = GOOGLE_SHEET_WEBAPP_EXEC;
  form.target = frameName;
  form.acceptCharset = 'UTF-8';
  form.style.display = 'none';

  for (const [key, val] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = val;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

  window.setTimeout(() => {
    iframe.remove();
  }, 30000);
}

/**
 * @copyright 2026 Designed & Developed by 이기적인 은퇴설계
 */

export default function ConsultationForm({ inputs, simulationResult }: Props) {
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
      let reportUrl: string | null = null;
      if (supabase && simulationResult) {
        try {
          const pdfBlob = await buildConsultationReportPdfBlob(simulationResult, {
            applicantName: name.trim(),
            applicantPhone: formattedPhone,
            birthDate: birthDate.trim(),
            location: location.trim(),
            preferredTime,
          });
          reportUrl = await uploadConsultationReportPdf(supabase, pdfBlob);
        } catch (pdfErr) {
          console.error('[consultation] pdf build/upload', pdfErr);
        }
      }

      postConsultationToGoogleScript({
        name: name.trim(),
        birthDate: birthDate.trim(),
        phone: formattedPhone,
        time: preferredTime,
        location: location.trim(),
        source: '이기적인 은퇴설계',
        report_url: reportUrl ?? '',
      });

      if (supabase) {
        await supabase.from('consultations').insert({
          name: name.trim(),
          phone: formattedPhone,
          preferred_time: preferredTime,
          current_age: inputs.currentAge,
          retirement_age: inputs.retirementAge,
          annual_salary: inputs.annualSalary,
          monthly_expense: inputs.monthlyExpense,
          birth_date: birthDate.trim(),
          location: location.trim(),
          report_url: reportUrl,
        });
      }
      
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
      <section className="select-none rounded-[20px] border border-toss-line bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02]">
        <div className="mb-5 border-b border-toss-line/80 pb-4">
          <span className="mb-3 inline-block rounded-full bg-toss-blue/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-toss-blue">
            무료 상담 신청
          </span>
          <h2 className="text-[17px] font-extrabold leading-snug text-toss-ink">
            나만을 위한 특별한 전략
            <br />
            <span className="text-toss-blue">이기적인 은퇴설계 신청하기</span>
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" className="w-full rounded-xl border border-toss-line px-4 py-3 text-sm outline-none transition focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/15" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">생년월일</label>
              <input type="text" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} placeholder="850101" className="w-full rounded-xl border border-toss-line px-4 py-3 text-sm outline-none transition focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/15" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">연락처</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className="w-full rounded-xl border border-toss-line px-4 py-3 text-sm outline-none transition focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/15" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">상담 지역</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="예: 서울 강남구" className="w-full rounded-xl border border-toss-line px-4 py-3 text-sm outline-none transition focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/15" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase">상담 희망 시간</label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_OPTIONS.map((t) => (
                <button key={t} type="button" onClick={() => setPreferredTime(t)} className={`rounded-xl border px-3 py-2.5 text-[11px] font-semibold transition-all ${preferredTime === t ? 'border-toss-blue bg-toss-blue/10 text-toss-blue' : 'border-toss-line text-toss-sub hover:border-toss-sub'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 py-2">
            <input type="checkbox" id="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 rounded border-toss-line text-toss-blue accent-toss-blue" />
            <label htmlFor="agree" className="text-[11px] text-slate-500 leading-snug cursor-pointer">
              (필수) 개인정보 수집 및 이용에 동의합니다. <br/>
              <span className="text-[10px] text-slate-400">상담 목적 이외에 사용되지 않습니다.</span>
            </label>
          </div>

          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-toss-blue py-4 text-sm font-bold text-white shadow-lg shadow-toss-blue/25 transition-all hover:bg-toss-bluePress disabled:opacity-40">
            {loading ? '접수 중...' : '이기적인 은퇴설계 상담 신청'}
          </button>
        </form>

        {/* 저작권 표시 수정 완료 */}
        <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-toss-line/60 pt-4 opacity-80">
          <ShieldAlert size={12} className="text-toss-sub" />
          <p className="text-[10px] font-medium tracking-tight text-toss-sub">
            Designed by <span className="font-bold">이기적인 은퇴설계</span> | ⓒ 2026 All rights reserved.
          </p>
        </div>
      </section>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="relative w-full max-w-sm rounded-3xl border border-toss-line bg-white p-8 text-center shadow-2xl">
            <button onClick={() => setShowSuccess(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
              <X size={20} />
            </button>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-toss-blue/10">
              <CheckCircle size={36} className="text-toss-blue" />
            </div>
            <h3 className="mb-2 text-xl font-extrabold text-toss-ink">접수가 완료되었습니다</h3>
            <p className="text-sm leading-relaxed text-toss-sub">
              남다른 노후를 위한 첫 걸음,<br />전문가가 곧 연락드리겠습니다.
            </p>
            <button onClick={() => setShowSuccess(false)} className="mt-6 w-full rounded-2xl bg-toss-blue py-3.5 text-sm font-bold text-white shadow-md shadow-toss-blue/20 transition hover:bg-toss-bluePress">
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}