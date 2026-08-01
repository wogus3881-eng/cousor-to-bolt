import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LiteFlow from './LiteFlow';
import LiteFlowV2 from './LiteFlowV2';
import ProApp from './ProApp';
import BlockedPage from './pages/BlockedPage';

/**
 * /pro 기본 링크(코드 없음)는 로그인 없이 바로 체험 가능한 Trial로 보냅니다.
 * ?code=BASIC-TEST01 / TRIAL-TEST01 처럼 코드 prefix가 있으면 해당 티어로 분기합니다.
 */
function ProAutoRedirect() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const code = params.get('code')?.toUpperCase() ?? '';
  if (!code || code.startsWith('TRIAL')) {
    return <Navigate to={`/pro/trial${search}`} replace />;
  }
  if (code.startsWith('BASIC')) {
    return <Navigate to={`/pro/basic${search}`} replace />;
  }
  return <Navigate to={`/pro/plus${search}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/v2" replace />} />
        <Route path="/v1" element={<LiteFlow />} />
        <Route path="/v2" element={<LiteFlowV2 />} />
        <Route path="/lite" element={<Navigate to="/v2" replace />} />
        <Route path="/blocked" element={<BlockedPage />} />
        <Route path="/pro/trial" element={<ProApp tier="trial" />} />
        <Route path="/pro/basic" element={<ProApp tier="basic" />} />
        <Route path="/pro/plus" element={<ProApp tier="plus" />} />
        {/* /pro?code=BASIC-TEST01 → /pro/basic?code=BASIC-TEST01 자동 분기 */}
        <Route path="/pro" element={<ProAutoRedirect />} />
        <Route path="*" element={<Navigate to="/v2" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
