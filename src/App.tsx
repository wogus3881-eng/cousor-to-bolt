import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LiteFlow from './LiteFlow';
import LiteFlowV2 from './LiteFlowV2';
import ProApp from './ProApp';
import BlockedPage from './pages/BlockedPage';

function ProPlusRedirect() {
  const { search } = useLocation();
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
        <Route path="/pro" element={<ProPlusRedirect />} />
        <Route path="*" element={<Navigate to="/v2" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
