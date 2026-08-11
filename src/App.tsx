import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LiteFlow from './LiteFlow';
import LiteFlowV2 from './LiteFlowV2';
import ProApp from './ProApp';
import BlockedPage from './pages/BlockedPage';
import ProLanding from './pages/ProLanding';
import TermsPage from './pages/TermsPage';
import InvitePage from './pages/InvitePage';

/**
 * 코드 없이 /pro로 들어오면 소개 랜딩 페이지를 보여줍니다.
 * ?code=BASIC-TEST01 / TRIAL-TEST01 처럼 코드 prefix가 있으면 해당 티어로 바로 분기합니다.
 */
function ProAutoRedirect() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const code = params.get('code')?.toUpperCase() ?? '';
  if (!code) {
    return <ProLanding />;
  }
  if (code.startsWith('TRIAL')) {
    return <Navigate to={`/pro/trial${search}`} replace />;
  }
  if (code.startsWith('BASIC')) {
    return <Navigate to={`/pro/basic${search}`} replace />;
  }
  return <Navigate to={`/pro/pro${search}`} replace />;
}

/** 예전 /pro/plus 링크(북마크 등) 호환용 — /pro/pro로 그대로 넘겨줍니다. */
function LegacyPlusRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/pro/pro${search}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/v2" replace />} />
        <Route path="/v1" element={<LiteFlow />} />
        <Route path="/v2" element={<LiteFlowV2 />} />
        <Route path="/self" element={<LiteFlowV2 hideConsultation />} />
        <Route path="/lite" element={<Navigate to="/v2" replace />} />
        <Route path="/blocked" element={<BlockedPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/pro/trial" element={<ProApp tier="trial" />} />
        <Route path="/pro/basic" element={<ProApp tier="basic" />} />
        <Route path="/pro/pro" element={<ProApp tier="pro" />} />
        <Route path="/pro/plus" element={<LegacyPlusRedirect />} />
        {/* /pro?code=BASIC-TEST01 → /pro/basic?code=BASIC-TEST01 자동 분기 */}
        <Route path="/pro" element={<ProAutoRedirect />} />
        <Route path="*" element={<Navigate to="/v2" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
