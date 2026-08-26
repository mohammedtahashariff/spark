import { DatabaseProvider } from './context/DatabaseContext';
import SimulationShell from './components/SimulationShell';


function App() {
  return (
    <DatabaseProvider>
      <SimulationShell />
    </DatabaseProvider>
  );
}

export default App;
