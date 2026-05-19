import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LiteFlow from './LiteFlow';
import LiteFlowV2 from './LiteFlowV2';
import ProApp from './ProApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/v2" replace />} />
        <Route path="/v1" element={<LiteFlow />} />
        <Route path="/v2" element={<LiteFlowV2 />} />
        <Route path="/lite" element={<Navigate to="/v2" replace />} />
        <Route path="/pro/basic" element={<ProApp tier="basic" />} />
        <Route path="/pro/plus" element={<ProApp tier="plus" />} />
        <Route path="/pro" element={<Navigate to="/pro/plus" replace />} />
        <Route path="*" element={<Navigate to="/v2" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
