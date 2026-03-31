import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Sidebar from './page/sidbar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './page/dashboard/Dashboard';
// import Employee from './page/employee/Employee ';

function App() {
  return (
    <Router>
      <div className="d-flex">
        
        <Sidebar />

        <div className="flex-grow-1 p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* <Route path="/employees" element={<Employee />} /> */}
          </Routes>
        </div>

      </div>
    </Router>

  );
}

export default App;
