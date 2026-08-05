import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useAppData } from './lib/useAppData';
import { useSharedExerciseFilters } from './lib/useSharedFilters';
import Dashboard from './pages/Dashboard';
import Programs from './pages/Programs';
import Strength from './pages/Strength';
import Progression from './pages/Progression';
import Records from './pages/Records';
import Help from './pages/Help';

function App() {
  const appData = useAppData();
  const exerciseFilters = useSharedExerciseFilters(appData.data.strengthSessions);

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard appData={appData} />} />
          <Route path="/programmes" element={<Programs appData={appData} />} />
          <Route path="/musculation" element={<Strength appData={appData} />} />
          <Route
            path="/progression"
            element={<Progression appData={appData} filters={exerciseFilters} />}
          />
          <Route path="/records" element={<Records appData={appData} filters={exerciseFilters} />} />
          <Route path="/aide" element={<Help />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
