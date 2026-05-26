import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LiteFlow from './LiteFlow';
import LiteFlowV2 from './LiteFlowV2';
import ProApp from './ProApp';
import BlockedPage from './pages/BlockedPage';

/**
 * ?code=BASIC-TEST01 처럼 Basic 코드로 /pro 진입 시
 * 코드 prefix를 보고 /pro/basic 으로 자동 라우팅합니다.
 */
function ProAutoRedirect() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const code = params.get('code') ?? '';
  if (code.toUpperCase().startsWith('BASIC')) {
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
        <Route path="/pro/basic" element={<ProApp tier="basic" />} />
        <Route path="/pro/plus" element={<ProApp tier="plus" />} />
        {/* /pro?code=BASIC-TEST01 → /pro/basic?code=BASIC-TEST01 자동 분기 */}
        <Route path="/pro" element={<ProAutoRedirect />} />
        <Route path="*" element={<Navigate to="/v2" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
