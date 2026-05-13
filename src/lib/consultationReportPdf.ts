import type { SupabaseClient } from '@supabase/supabase-js';
import type { SimulationResult } from './calculator';
import { formatKRW } from './calculator';
import { computeLiteReadiness, computeRetirementIncomeFlow } from './liteResultMetrics';

export interface ConsultationReportMeta {
  applicantName: string;
  applicantPhone: string;
  birthDate: string;
  location: string;
  preferredTime: string;
}

/**
 * Bolt 등 `npm install` 없이 동작: CDN ESM만 사용 (`/* @vite-ignore */`).
 * esm.sh 차단 시 jsDelivr 등으로 폴백 (미리보기 CSP·네트워크 이슈 완화).
 */
const HTML2CANVAS_CDNS = [
  'https://esm.sh/html2canvas@1.4.1',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm',
] as const;

const JSPDF_CDNS = [
  'https://esm.sh/jspdf@2.5.2',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm',
] as const;

async function importFirstWorking<T>(urls: readonly string[]): Promise<T> {
  let last: unknown;
  for (const url of urls) {
    try {
      return (await import(/* @vite-ignore */ url)) as T;
    } catch (err) {
      last = err;
      console.warn('[consultationReportPdf] CDN import failed, trying next', url, err);
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

/** html2canvas + jsPDF — 한글은 시스템 폰트로 캡처 */
export async function buildConsultationReportPdfBlob(
  result: SimulationResult,
  meta: ConsultationReportMeta,
): Promise<Blob> {
  const readiness = computeLiteReadiness(result);
  const flow = computeRetirementIncomeFlow(result);
  const { inputs, retirementBalance, dignityEndAge, pensionAtRetirement, inflationAdjustedMonthlyExpense, extraNeeded, healthInsuranceTriggered, pensionNetAtRetirement } = result;

  const wrap = document.createElement('div');
  wrap.style.cssText = [
    'position:fixed',
    'left:-12000px',
    'top:0',
    'width:420px',
    'padding:22px',
    'box-sizing:border-box',
    'font-family:Pretendard,system-ui,sans-serif',
    'font-size:13px',
    'background:#ffffff',
    'color:#191f28',
    'line-height:1.45',
  ].join(';');

  const h1 = document.createElement('h1');
  h1.style.cssText = 'font-size:18px;margin:0 0 10px;font-weight:800;letter-spacing:-0.02em';
  h1.textContent = '진단 요약 (상담 첨부용)';
  wrap.appendChild(h1);

  const disclaimer = document.createElement('p');
  disclaimer.style.cssText = 'font-size:11px;color:#6b7684;margin:0 0 16px';
  disclaimer.textContent =
    '참고용 시뮬레이션 결과입니다. 투자·보험·세무 자문이나 계약 청약이 아니며, 실제 조건과 다를 수 있습니다.';
  wrap.appendChild(disclaimer);

  function addSection(title: string, rows: [string, string][]) {
    const sec = document.createElement('div');
    sec.style.cssText = 'margin-bottom:14px;padding-top:10px;border-top:1px solid #e5e8eb';
    const ht = document.createElement('div');
    ht.style.cssText = 'font-weight:700;font-size:13px;margin-bottom:8px';
    ht.textContent = title;
    sec.appendChild(ht);
    for (const [k, v] of rows) {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;justify-content:space-between;gap:10px;font-size:12px;margin:4px 0;align-items:flex-start';
      const kEl = document.createElement('span');
      kEl.style.cssText = 'color:#6b7684;flex:1';
      kEl.textContent = k;
      const vEl = document.createElement('span');
      vEl.style.cssText = 'font-weight:600;text-align:right;max-width:58%';
      vEl.textContent = v;
      row.appendChild(kEl);
      row.appendChild(vEl);
      sec.appendChild(row);
    }
    wrap.appendChild(sec);
  }

  addSection('신청자 정보', [
    ['이름', meta.applicantName],
    ['연락처', meta.applicantPhone],
    ['생년월일', meta.birthDate],
    ['상담 지역', meta.location],
    ['희망 시간', meta.preferredTime],
  ]);

  const monthlyTotal = inputs.monthlyBank + inputs.monthlyStock + inputs.monthlyInsurance;

  addSection('입력 요약', [
    ['현재 나이', `${inputs.currentAge}세`],
    ['은퇴 목표 나이', `${inputs.retirementAge}세`],
    ['세전 연봉', formatKRW(inputs.annualSalary)],
    ['은퇴 후 희망 월 생활비', formatKRW(inputs.monthlyExpense)],
    ['현재 준비 자산', formatKRW(inputs.currentSavings)],
    ['월 저축 합계(추정)', formatKRW(monthlyTotal)],
  ]);

  const dignityLine =
    dignityEndAge === null ? '100세까지 큰 부족 없음(참고)' : `약 ${dignityEndAge}세 전후 한계(참고)`;

  const rows: [string, string][] = [
    ['준비 점수(참고)', `${readiness.score} / 100 · ${readiness.label}`],
    ['은퇴 시점 예상 자산', formatKRW(retirementBalance)],
    ['은퇴 후 필요 월생활비(물가 반영)', formatKRW(inflationAdjustedMonthlyExpense)],
    ['국민연금(세전 월 추정)', formatKRW(pensionAtRetirement)],
  ];
  if (healthInsuranceTriggered) {
    rows.push(['국민연금(세후 월 추정)', formatKRW(pensionNetAtRetirement)]);
  }
  rows.push(
    ['은퇴 직후 월 부족분(추정)', formatKRW(flow.fromAssets)],
    ['품격 유지 한계', dignityLine],
  );
  if (dignityEndAge !== null && dignityEndAge <= 90 && extraNeeded > 0) {
    rows.push(['90세까지 부족 추정', formatKRW(extraNeeded)]);
  }
  addSection('진단 요약', rows);

  document.body.appendChild(wrap);
  try {
    const html2canvas = (
      await importFirstWorking<{ default: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement> }>(
        HTML2CANVAS_CDNS,
      )
    ).default;
    const { jsPDF } = await importFirstWorking<{
      jsPDF: new (opts?: Record<string, unknown>) => {
        internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
        addImage: (d: string, fmt: string, x: number, y: number, w: number, h: number) => void;
        output: (t: 'blob') => Blob;
      };
    }>(JSPDF_CDNS);
    const canvas = await html2canvas(wrap, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });
    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;
    const mmPerPx = 0.2645833333;
    const imgWmm = canvas.width * mmPerPx;
    const imgHmm = canvas.height * mmPerPx;
    const ratio = Math.min((pageW - 2 * margin) / imgWmm, (pageH - 2 * margin) / imgHmm);
    const drawW = imgWmm * ratio;
    const drawH = imgHmm * ratio;
    const x = (pageW - drawW) / 2;
    const y = margin;
    doc.addImage(imgData, 'PNG', x, y, drawW, drawH);
    return doc.output('blob');
  } finally {
    document.body.removeChild(wrap);
  }
}

export async function uploadConsultationReportPdf(
  client: SupabaseClient,
  blob: Blob,
): Promise<string | null> {
  const fileName = `${crypto.randomUUID()}.pdf`;
  const { error } = await client.storage.from('consultation-reports').upload(fileName, blob, {
    contentType: 'application/pdf',
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    console.error('[consultation] storage upload failed', error);
    return null;
  }
  const { data } = client.storage.from('consultation-reports').getPublicUrl(fileName);
  return data.publicUrl;
}
