import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { HomePage } from './components/HomePage';
import { PracticeModeSelection, TuDuyMode, TinhNhanhMode, ToanGiaiMode, ToanCoBanMode } from './components/modes';
import { TestSetup, TestTaking, TestResults } from './components/test';
import { ProgressDashboard, WeakAreaAnalysis } from './components/progress';
import { AdminDashboard } from './components/admin';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/practice" element={<PracticeModeSelection />} />
          <Route path="/practice/tu-duy" element={<TuDuyMode />} />
          <Route path="/practice/tinh-nhanh" element={<TinhNhanhMode />} />
          <Route path="/practice/toan-giai" element={<ToanGiaiMode />} />
          <Route path="/practice/toan-co-ban" element={<ToanCoBanMode />} />
          <Route path="/test" element={<TestSetup />} />
          <Route path="/test/taking" element={<TestTaking />} />
          <Route path="/test/results" element={<TestResults />} />
          <Route path="/progress" element={<ProgressDashboard />} />
          <Route path="/progress/weak-areas" element={<WeakAreaAnalysis />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
