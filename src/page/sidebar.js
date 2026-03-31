import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./sidebar.css";

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { to: "/", icon: "bi-grid-1x2-fill", label: "Dashboard" },
    ],
  },
  {
    label: "Workforce",
    items: [
      { to: "/employees",  icon: "bi-people-fill",       label: "Employees"      },
      { to: "/users",      icon: "bi-person-badge-fill",  label: "Users"          },
      { to: "/leave",      icon: "bi-calendar2-x-fill",   label: "Employee Leave" },
    ],
  },
  {
    label: "Payroll",
    items: [
      { to: "/payroll",        icon: "bi-receipt-cutoff",     label: "Payroll"        },
      { to: "/basic-salary",   icon: "bi-cash-coin",          label: "Basic Salary"   },
      { to: "/payroll-config", icon: "bi-sliders2-vertical",  label: "Payroll Config" },
    ],
  },
  {
    label: "Earnings",
    items: [
      { to: "/allowance", icon: "bi-plus-circle-fill",  label: "Allowance" },
      { to: "/bonus",     icon: "bi-gift-fill",          label: "Bonus"     },
      { to: "/overtime",  icon: "bi-clock-history",      label: "Overtime"  },
    ],
  },
  {
    label: "Deductions",
    items: [
      { to: "/deduction", icon: "bi-dash-circle-fill", label: "Deduction" },
    ],
  },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`sidebar${collapsed ? " collapsed" : ""}`}>

      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <i className="bi bi-currency-dollar" />
        </div>
        <div className="sidebar-brand-text">
          <span className="title">PayrollPro</span>
          <span className="subtitle">Management</span>
        </div>
        <button
          className="sidebar-toggle-btn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`bi ${collapsed ? "bi-layout-sidebar" : "bi-layout-sidebar-reverse"}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {si > 0 && <div className="sidebar-divider" />}
            <div className="sidebar-section-label">{section.label}</div>

            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                title={collapsed ? item.label : undefined}
              >
                <i className={`bi ${item.icon} icon`} />
                <span className="link-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <NavLink to="/settings" className="sidebar-link" title={collapsed ? "Settings" : undefined}>
          <i className="bi bi-gear-fill icon" />
          <span className="link-label">Settings</span>
        </NavLink>
        <NavLink to="/logout" className="sidebar-link" title={collapsed ? "Logout" : undefined}>
          <i className="bi bi-box-arrow-left icon" />
          <span className="link-label">Logout</span>
        </NavLink>
      </div>

    </div>
  );
};

export default Sidebar;