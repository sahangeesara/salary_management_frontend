import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Sidebar from './page/sidebar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './page/dashboard/Dashboard';
import Employee from './page/employee/Employee';
import Allowance from './page/allowance/Allowance';
import Bonus from './page/bonus/Bonus';
import Overtime from './page/overtime/Overtime';
import Deduction from './page/deduction/Deduction';
import EmployeeLeave from './page/employeeLeave/EmployeeLeave';
import PayrollConfig from './page/payrollConfig/PayrollConfig';
import User from './page/user/User';
import Payroll from './page/payroll/Payroll';
import BasicSalary from './page/basicSalary/BasicSalary';

function App() {
  return (
    <Router>
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employee />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/allowance" element={<Allowance />} />
          <Route path="/basic-salary" element={<BasicSalary />} />
          <Route path="/bonus" element={<Bonus />} />
          <Route path="/overtime" element={<Overtime />} />
          <Route path="/deduction" element={<Deduction />} />
          <Route path="/leave" element={<EmployeeLeave />} />
          <Route path="/payroll-config" element={<PayrollConfig />} />
          <Route path="/users" element={<User />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;