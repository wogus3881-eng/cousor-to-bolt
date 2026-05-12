import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LiteFlow from './LiteFlow';
import ProApp from './ProApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LiteFlow />} />
        <Route path="/lite" element={<Navigate to="/" replace />} />
        <Route path="/pro" element={<ProApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
