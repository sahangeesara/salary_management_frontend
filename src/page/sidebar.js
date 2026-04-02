import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./sidebar.css";

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [{ to: "/", icon: "bi-grid-1x2-fill", label: "Dashboard" }],
  },
  {
    label: "Workforce",
    items: [
      { to: "/employees", icon: "bi-people-fill", label: "Employees" },
      { to: "/users", icon: "bi-person-badge-fill", label: "Users" },
      { to: "/leave", icon: "bi-calendar2-x-fill", label: "Employee Leave" },
    ],
  },
  {
    label: "Payroll",
    items: [
      { to: "/payroll", icon: "bi-receipt-cutoff", label: "Payroll" },
      { to: "/basic-salary", icon: "bi-cash-coin", label: "Basic Salary" },
      { to: "/payroll-config", icon: "bi-sliders2-vertical", label: "Payroll Config" },
    ],
  },
  {
    label: "Earnings",
    items: [
      { to: "/allowance", icon: "bi-plus-circle-fill", label: "Allowance" },
      { to: "/bonus", icon: "bi-gift-fill", label: "Bonus" },
      { to: "/overtime", icon: "bi-clock-history", label: "Overtime" },
    ],
  },
  {
    label: "Deductions",
    items: [{ to: "/deduction", icon: "bi-dash-circle-fill", label: "Deduction" }],
  },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  return (
    <>
      {/* Mobile Top Nav (Visible < 992px) */}
      <nav className="mobile-top-nav">
        <div className="nav-brand">Sahan</div>
        <button className={`nav-toggle ${isMobileOpen ? 'open' : ''}`} onClick={() => setIsMobileOpen(!isMobileOpen)}>
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* Overlay for Mobile */}
      <div className={`sidebar-overlay ${isMobileOpen ? "active" : ""}`} onClick={() => setIsMobileOpen(false)} />

      {/* Sidebar Shell */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand-area">
          <div className="brand-logo"><i className="bi bi-currency-dollar" /></div>
          <div className="brand-text">
            <span className="title">PayrollPro</span>
            <span className="subtitle">Sahan Management</span>
          </div>
          <button className="collapse-toggle" onClick={() => setCollapsed(!collapsed)}>
            <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`} />
          </button>
        </div>

        {/* Scrollable Nav Area - Scrollbar is hidden via CSS */}
        <div className="sidebar-scroll-area">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className="nav-group">
              <p className="group-label">{section.label}</p>
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                  <i className={`bi ${item.icon} icon`} />
                  <span className="label-text">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>

      </aside>
    </>
  );
};

export default Sidebar;