import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useAppData } from './lib/useAppData';
import Dashboard from './pages/Dashboard';
import Programs from './pages/Programs';
import Strength from './pages/Strength';
import Running from './pages/Running';
import Progression from './pages/Progression';
import Records from './pages/Records';

function App() {
  const appData = useAppData();

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard appData={appData} />} />
          <Route path="/programmes" element={<Programs appData={appData} />} />
          <Route path="/musculation" element={<Strength appData={appData} />} />
          <Route path="/course" element={<Running appData={appData} />} />
          <Route path="/progression" element={<Progression appData={appData} />} />
          <Route path="/records" element={<Records appData={appData} />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
