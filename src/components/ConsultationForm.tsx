import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, X, ShieldAlert, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { resolveAgentConfig, supabaseAgentId } from '../lib/agentConfig';
import { useAgentId } from '../lib/useAgentId';
import { trackMetaLead, trackNaverLead } from '../lib/trackingEvents';
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

const MIN_CONSULTATION_AGE = 29;

const INELIGIBLE_MESSAGE =
  '본 상담은 만 29세 이상을 대상으로 합니다. 아래 진단은 참고용으로 활용해 주세요.';

/** 출생연도 기준 만 나이: 올해 − 출생연도 (생일 전후 보정 없음) */
function parseYearBasedAgeFromBirthDate(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 6 && digits.length !== 8) return null;

  let year: number;
  let month: number;
  let day: number;

  if (digits.length === 8) {
    year = Number(digits.slice(0, 4));
    month = Number(digits.slice(4, 6));
    day = Number(digits.slice(6, 8));
  } else {
    const yy = Number(digits.slice(0, 2));
    year = yy >= 30 ? 1900 + yy : 2000 + yy;
    month = Number(digits.slice(2, 4));
    day = Number(digits.slice(4, 6));
  }

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const age = new Date().getFullYear() - year;
  return age >= 0 && age <= 120 ? age : null;
}

/**
 * @copyright 2026 Designed & Developed by 이기적인 은퇴설계
 */
export default function ConsultationForm({ inputs }: Props) {
  const agentParam = useAgentId();
  const agentConfig = useMemo(() => resolveAgentConfig(agentParam), [agentParam]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [location, setLocation] = useState('');
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [agreedThirdParty, setAgreedThirdParty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const birthYearAge = useMemo(() => parseYearBasedAgeFromBirthDate(birthDate.trim()), [birthDate]);
  const diagnosisAge = inputs.currentAge;
  const isUnderMinAgeFromDiagnosis = diagnosisAge > 0 && diagnosisAge < MIN_CONSULTATION_AGE;
  const isUnderMinAgeFromBirthDate = birthYearAge !== null && birthYearAge < MIN_CONSULTATION_AGE;
  const isIneligible = isUnderMinAgeFromDiagnosis || isUnderMinAgeFromBirthDate;

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

  function togglePreferredTime(time: string) {
    setPreferredTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
    );
  }

  const formatPhoneNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 11) return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    if (cleaned.length === 10) return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    return cleaned;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isIneligible) {
      setError(INELIGIBLE_MESSAGE);
      return;
    }

    if (!name.trim() || !phone.trim() || !birthDate.trim() || preferredTimes.length === 0 || !location.trim()) {
      setError('모든 항목을 입력해주세요. 상담 가능한 시간대는 1개 이상 선택해 주세요.');
      return;
    }

    const ageFromBirth = parseYearBasedAgeFromBirthDate(birthDate.trim());
    if (ageFromBirth !== null && ageFromBirth < MIN_CONSULTATION_AGE) {
      setError(INELIGIBLE_MESSAGE);
      return;
    }

    if (!agreed) {
      setError('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }

    if (!agreedThirdParty) {
      setError('개인정보 제3자 제공에 동의해주세요.');
      return;
    }

    setError('');
    setLoading(true);

    const formattedPhone = formatPhoneNumber(phone.trim());
    const timeLabel = preferredTimes.join(', ');

    // 1. PDF 생성
    let pdfBase64 = '';
    let pdfFileName = '';
    try {
      const { generateResultPdfBase64 } = await import('../lib/generateResultPdf');
      const pdfJson = await generateResultPdfBase64(name.trim() || '고객');
      if (pdfJson) {
        const parsed = JSON.parse(pdfJson);
        pdfBase64 = parsed.base64;
        pdfFileName = parsed.fileName;
        console.log('[상담신청] PDF 생성 성공:', pdfFileName);
      }
    } catch (pdfErr) {
      console.warn('[상담신청] PDF 생성 실패 (접수는 계속 진행):', pdfErr);
    }

    const payload = {
      name: name.trim(),
      birthDate: birthDate.trim(),
      phone: formattedPhone,
      time: timeLabel,
      location: location.trim(),
      source: agentConfig.sourceLabel,
      agentId: agentConfig.agentId,
      thirdPartyAgreed: agreedThirdParty,
      pdfBase64,
      pdfFileName,
    };

    console.log('[상담신청] 전송 시작 - agentId:', agentConfig.agentId);
    console.log('[상담신청] GAS URL:', agentConfig.googleSheetWebAppUrl);

    // 2. Google Sheets 전송
    let sheetSuccess = false;
    try {
      const res = await fetch(agentConfig.googleSheetWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      console.log('[상담신청] fetch 응답 status:', res.status);
      const text = await res.text();
      console.log('[상담신청] fetch 응답 body:', text);
      sheetSuccess = true;
    } catch (fetchErr) {
      console.warn('[상담신청] fetch 실패, no-cors 재시도:', fetchErr);
      try {
        await fetch(agentConfig.googleSheetWebAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(payload),
        });
        console.log('[상담신청] no-cors 재시도 완료');
        sheetSuccess = true;
      } catch (noCorsErr) {
        console.error('[상담신청] no-cors도 실패:', noCorsErr);
        sheetSuccess = false;
      }
    }

    // 3. Supabase 저장
    if (supabase) {
      try {
        const { error: sbErr } = await supabase.from('consultations').insert({
          name: name.trim(),
          phone: formattedPhone,
          preferred_time: timeLabel,
          current_age: inputs.currentAge,
          retirement_age: inputs.retirementAge,
          annual_salary: inputs.annualSalary,
          monthly_expense: inputs.monthlyExpense,
          birth_date: birthDate.trim(),
          location: location.trim(),
          agent_id: supabaseAgentId(agentConfig),
        });
        if (sbErr) console.warn('[상담신청] Supabase 오류:', sbErr);
        else console.log('[상담신청] Supabase 저장 성공');
      } catch (sbEx) {
        console.warn('[상담신청] Supabase 예외:', sbEx);
      }
    }

    setLoading(false);

    if (sheetSuccess) {
      trackMetaLead({ name: name.trim(), agentId: agentConfig.agentId });
      trackNaverLead();
      setShowSuccess(true);
      setName('');
      setPhone('');
      setBirthDate('');
      setLocation('');
      setAgreed(false);
      setAgreedThirdParty(false);
      setPreferredTimes([]);
    } else {
      setError('접수 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 직접 연락 주세요.');
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

        {isIneligible && (
          <div className="mb-4 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="text-[12px] leading-relaxed text-amber-900">
              <p className="font-bold">상담 신청 대상이 아닙니다</p>
              <p className="mt-1">{INELIGIBLE_MESSAGE}</p>
              {isUnderMinAgeFromDiagnosis && (
                <p className="mt-1 text-[11px] text-amber-800">진단에 입력하신 나이: 만 {diagnosisAge}세</p>
              )}
              {isUnderMinAgeFromBirthDate && birthYearAge !== null && (
                <p className="mt-1 text-[11px] text-amber-800">출생연도 기준: 만 {birthYearAge}세</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full rounded-xl border border-toss-line px-4 py-3 text-sm outline-none transition focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/15"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">생년월일</label>
              <input
                type="text"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                placeholder="850101"
                className="w-full rounded-xl border border-toss-line px-4 py-3 text-sm outline-none transition focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/15"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">연락처</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="w-full rounded-xl border border-toss-line px-4 py-3 text-sm outline-none transition focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">상담 지역</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 서울 강남구"
              className="w-full rounded-xl border border-toss-line px-4 py-3 text-sm outline-none transition focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/15"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">상담 희망 시간</label>
            <p className="mb-2 text-[10px] text-toss-sub">가능한 시간대를 모두 선택해 주세요 (복수 선택)</p>
            <div className="grid grid-cols-2 gap-2">
              {TIME_OPTIONS.map((t) => {
                const selected = preferredTimes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => togglePreferredTime(t)}
                    className={`flex items-center justify-center gap-1 rounded-xl border px-3 py-2.5 text-[11px] font-semibold transition-all ${
                      selected
                        ? 'border-toss-blue bg-toss-blue/10 text-toss-blue'
                        : 'border-toss-line text-toss-sub hover:border-toss-sub'
                    }`}
                  >
                    {selected ? <Check size={14} strokeWidth={2.5} className="shrink-0" /> : null}
                    {t}
                  </button>
                );
              })}
            </div>
            {preferredTimes.length > 0 && (
              <p className="mt-2 text-[10px] text-toss-sub">선택: {preferredTimes.join(' · ')}</p>
            )}
          </div>

          <div className="flex items-start gap-2 py-2">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-toss-line text-toss-blue accent-toss-blue"
            />
            <label htmlFor="agree" className="cursor-pointer text-[11px] leading-snug text-slate-500">
              (필수) 개인정보 수집 및 이용에 동의합니다. <br />
              <span className="text-[10px] text-slate-400">상담 목적 이외에 사용되지 않습니다.</span>
            </label>
          </div>

          <div className="flex items-start gap-2 py-1">
            <input
              type="checkbox"
              id="agreeThirdParty"
              checked={agreedThirdParty}
              onChange={(e) => setAgreedThirdParty(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-toss-line text-toss-blue accent-toss-blue"
            />
            <label htmlFor="agreeThirdParty" className="cursor-pointer text-[11px] leading-snug text-slate-500">
              (필수) 개인정보 제3자 제공에 동의합니다.<br />
              <span className="text-[10px] text-slate-400">
                수집된 정보는 보험 상담 목적으로 제휴 설계사에게 제공될 수 있습니다.
              </span>
            </label>
          </div>

          {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || isIneligible}
            className="w-full rounded-2xl bg-toss-blue py-4 text-sm font-bold text-white shadow-lg shadow-toss-blue/25 transition-all hover:bg-toss-bluePress disabled:opacity-40"
          >
            {loading ? '접수 중...' : isIneligible ? '만 29세 이상 대상' : '이기적인 은퇴설계 상담 신청'}
          </button>
        </form>

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
            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-toss-blue/10">
              <CheckCircle size={36} className="text-toss-blue" />
            </div>
            <h3 className="mb-2 text-xl font-extrabold text-toss-ink">접수가 완료되었습니다</h3>
            <p className="text-sm leading-relaxed text-toss-sub">
              남다른 노후를 위한 첫 걸음,
              <br />
              전문가가 곧 연락드리겠습니다.
            </p>
            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              className="mt-6 w-full rounded-2xl bg-toss-blue py-3.5 text-sm font-bold text-white shadow-md shadow-toss-blue/20 transition hover:bg-toss-bluePress"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
