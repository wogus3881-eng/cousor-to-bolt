/**
 * 고객용 간편 진단 — 참고·면책 고지 (법률 자문 아님, UX용 문구)
 */
export function LiteLegalDisclaimerCompact() {
  return (
    <p className="text-[10px] leading-relaxed text-toss-sub">
      본 화면은 <strong className="text-toss-ink">참고용 시뮬레이션</strong>이며, 투자·보험·세무 등에 대한{' '}
      <strong className="text-toss-ink">자문·권유·계약 청약이 아닙니다.</strong> 실제 결정은 전문가와 상담하세요.
    </p>
  );
}

export default function LiteLegalDisclaimer() {
  return (
    <section
      className="rounded-[20px] border border-toss-line bg-toss-canvas/80 px-4 py-4 text-[11px] leading-relaxed text-toss-sub ring-1 ring-black/[0.02]"
      aria-label="이용 안내 및 면책"
    >
      <h3 className="mb-2 text-[12px] font-bold text-toss-ink">이용 안내 · 한계 고지</h3>
      <ul className="list-inside list-disc space-y-1.5 marker:text-toss-sub">
        <li>
          본 간편 진단은 <strong className="text-toss-ink">일반적인 가정과 단순화된 모델</strong>에 따른{' '}
          <strong className="text-toss-ink">참고용 수치</strong>이며, 개인의 전체 재무·세법·상품 약관·건강·가족 구성 등을
          반영한 <strong className="text-toss-ink">맞춤 설계나 법률·세무·재무 자문이 아닙니다.</strong>
        </li>
        <li>
          그래프·요약 문구는 이해를 돕기 위한 <strong className="text-toss-ink">시각적 스케치</strong>에 가깝고, 실제
          시장·금리·물가·연금 정책·세율 변동과 다를 수 있습니다.
        </li>
        <li>
          <strong className="text-toss-ink">준비 점수·진단 코멘트</strong>는 인공지능 자동 생성이 아니라, 입력값에 따른{' '}
          <strong className="text-toss-ink">내부 규칙 기반 참고 문구</strong>이며 절대평가·공신력 지표가 아닙니다.
        </li>
        <li>
          <strong className="text-toss-ink">수익·원금 보장을 약속하지 않으며,</strong> 과거·시뮬레이션 결과가 미래
          성과를 보장하지 않습니다.
        </li>
        <li>
          <strong className="text-toss-ink">투자 권유·보험 모집·계약 청약에 해당하지 않습니다.</strong> 상품 가입·
          투자 실행 전에는 반드시 해당 기관의 설명서·약관 및 자격을 갖춘 전문가와 상담하시기 바랍니다.
        </li>
        <li>
          무료 상담 신청 시 수집되는 개인정보는 상담 목적에 한하며, 자세한 내용은 동의 화면 및 운영 정책을 따릅니다.
        </li>
      </ul>
      <p className="mt-3 border-t border-toss-line pt-3 text-[10px] text-toss-sub/90">
        위 문구는 서비스 이해를 돕기 위한 것이며, <strong className="text-toss-ink">법적 효력·분쟁에 대한 최종 해석은
        관계 법령 및 전문가 자문</strong>에 따릅니다.
      </p>
    </section>
  );
}
