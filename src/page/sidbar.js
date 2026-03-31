import React from "react";

const Sidebar = () => {
  return (
    <div className="d-flex">
      
      {/* Sidebar */}
      <div
        className="bg-dark text-white p-3"
        style={{ width: "250px", minHeight: "100vh" }}
      >
        <h4 className="text-center mb-4">Payroll System</h4>

        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item">
            <a href="/" className="nav-link text-white">
              Dashboard
            </a>
          </li>

          <li>
            <a href="/employee" className="nav-link text-white">
              Employees
            </a>
          </li>

          <li>
            <a href="/payroll" className="nav-link text-white">
              Payroll
            </a>
          </li>

          <li>
            <a href="/report" className="nav-link text-white">
              Reports
            </a>
          </li>

          <li>
            <a href="/setting" className="nav-link text-white">
              Settings
            </a>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        <h2>Welcome</h2>
        <p>Main content area</p>
      </div>

    </div>
  );
};

export default Sidebar;