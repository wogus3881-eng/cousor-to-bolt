import { Link } from 'react-router-dom';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '제1조 (목적)',
    body: [
      '이 약관은 제이하이브 플랜(이하 "회사")이 제공하는 은퇴설계 시뮬레이션 및 리포트 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 정함을 목적으로 합니다.',
    ],
  },
  {
    title: '제2조 (계정)',
    body: [
      '이용자는 본인 명의로만 계정을 생성해야 하며, 계정 정보를 제3자와 공유하거나 대여·양도할 수 없습니다.',
      '서비스는 동시 1개 세션만 유지되며, 다른 기기에서 로그인 시 기존 세션은 자동 종료될 수 있습니다.',
    ],
  },
  {
    title: '제3조 (지식재산권)',
    body: [
      '서비스의 소스코드, 화면 구성(UI/UX), 계산 로직, 산출 알고리즘, AI 프롬프트, 리포트 템플릿, 그 밖에 서비스 운영 과정에서 생성된 일체의 자료에 대한 저작권 및 영업비밀은 회사에 귀속됩니다.',
      '이용자는 서비스 이용을 통해 위 자료에 대한 어떠한 권리도 취득하지 않습니다.',
    ],
  },
  {
    title: '제4조 (금지행위)',
    body: [
      '이용자는 다음 각 호의 행위를 해서는 안 됩니다.',
      '1. 서비스의 소스코드, 계산 로직, 프롬프트, UI, 리포트 양식 등을 복제, 역설계(리버스 엔지니어링), 재현, 모방하거나 이를 기반으로 경쟁 서비스를 개발·제공하는 행위',
      '2. 서비스 화면이나 산출 결과를 AI 모델 학습, 대량 캡처·크롤링·스크래핑 등의 방법으로 수집하여 유사 서비스 제작에 활용하는 행위',
      '3. 계정을 제3자와 공유하거나, 정당한 권한 없이 서비스를 재배포·재판매하는 행위',
      '4. 그 밖에 회사의 지식재산권 또는 영업비밀을 침해하는 행위',
      '이용자가 본 조를 위반한 경우, 회사는 사전 통지 없이 서비스 이용을 정지하거나 계약을 해지할 수 있으며, 이로 인해 발생한 손해에 대해 배상을 청구할 수 있습니다.',
    ],
  },
  {
    title: '제5조 (서비스의 성격 및 면책)',
    body: [
      '서비스가 제공하는 시뮬레이션, 진단 코멘트, 리포트는 일반적인 가정에 기반한 참고용 자료이며, 투자·보험·세무·법률 자문이나 상품 가입 권유·청약이 아닙니다.',
      '실제 재무 결정은 반드시 자격을 갖춘 전문가와 상담 후 이루어져야 하며, 회사는 서비스 이용으로 인해 발생한 이용자 또는 제3자의 손해에 대해 회사의 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.',
    ],
  },
  {
    title: '제6조 (환불 정책)',
    body: [
      '최초 결제 후 7일 이내이고 서비스를 이용하지 않았다면 전액 환불합니다.',
      '서비스를 이용하기 시작한 이후에는 단순 변심에 의한 환불은 제한되며, 자동결제 해지는 언제든 가능하고 해지해도 이미 결제한 기간까지는 계속 이용할 수 있습니다.',
      '연 구독을 중도 해지하는 경우도 환불은 되지 않으며, 다음 자동결제만 중단되고 남은 기간은 끝까지 이용할 수 있습니다.',
      '서비스 오류 등 회사 귀책 사유로 정상적으로 이용하지 못한 기간이 있다면 해당 기간만큼 별도로 보상합니다.',
    ],
  },
  {
    title: '제7조 (약관의 변경)',
    body: [
      '회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 서비스 내 공지를 통해 안내합니다.',
    ],
  },
  {
    title: '제8조 (준거법 및 관할)',
    body: [
      '이 약관과 관련한 분쟁은 대한민국 법을 준거법으로 하며, 관할 법원은 민사소송법에 따른 법원으로 합니다.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <p className="text-[11px] font-bold text-navy-400 tracking-wide uppercase mb-1">제이하이브 플랜</p>
        <h1 className="text-lg font-extrabold text-navy-900 mb-6">이용약관</h1>

        <div className="space-y-5 rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-[13px] font-bold text-navy-900 mb-1.5">{s.title}</h2>
              <div className="space-y-1">
                {s.body.map((line, i) => (
                  <p key={i} className="text-[12px] leading-relaxed text-slate-600">
                    {line}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          문의: <a href="mailto:henry-lim@naver.com" className="underline underline-offset-2">henry-lim@naver.com</a>
        </p>

        <Link to="/pro" className="mt-6 block text-center text-[12px] font-bold text-navy-600 underline underline-offset-2">
          Pro 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
