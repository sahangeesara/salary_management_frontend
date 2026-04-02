import React, { useState, useEffect, memo } from "react"; // Removed unused useCallback
import EmployeeService from "../../service/EmployeeService";
import BonusService from "../../service/BonusService";
import PayrollService from "../../service/PayrollService";
import AllowanceService from "../../service/AllowanceService";
import DeductionService from "../../service/DeductionService";
import OvertimeService from "../../service/OvertimeService ";
import LeaveService from "../../service/EmployeeLeaveService";
import "./dashboard.css";

/* ─── Mini sparkline bar chart ─── */
const SparkBar = memo(({ values = [], color = "#4f8ef7" }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="spark-wrap">
      {values.map((v, i) => (
        <div
          key={i}
          className="spark-bar"
          style={{
            height: `${Math.round((v / max) * 100)}%`,
            background: color,
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
    </div>
  );
});

/* ─── Stat Card ─── */
const StatCard = memo(({ icon, label, value, sub, color, spark, delay = 0 }) => (
  <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
    <div className="stat-top">
      <div className="stat-icon" style={{ background: color + "22", color }}>
        <i className={`bi ${icon}`} />
      </div>
      {spark && <SparkBar values={spark} color={color} />}
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
));

/* ─── Section header ─── */
const SectionHead = ({ icon, title, subtitle, color = "#4f8ef7" }) => (
  <div className="section-head">
    <div className="section-icon" style={{ background: color + "22", color }}>
      <i className={`bi ${icon}`} />
    </div>
    <div>
      <div className="section-title">{title}</div>
      {subtitle && <div className="section-subtitle">{subtitle}</div>}
    </div>
  </div>
);

/* ─── Donut chart (pure CSS/SVG) ─── */
const DonutChart = memo(({ segments }) => {
  const size = 120, r = 46, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circ;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset * circ + circ / 4}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        );
        offset += pct;
        return el;
      })}
      <circle cx={cx} cy={cy} r={32} fill="white" />
    </svg>
  );
});

/* ─── Horizontal bar ─── */
const HBar = ({ label, value, max, color }) => (
  <div className="hbar-row">
    <div className="hbar-label">{label}</div>
    <div className="hbar-track">
      <div
        className="hbar-fill"
        style={{ width: `${Math.round((value / (max || 1)) * 100)}%`, background: color }}
      />
    </div>
    <div className="hbar-val">{value}</div>
  </div>
);

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [allowances, setAllowances] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(new Date());

  useEffect(() => {
    const safeFetch = (fn) => fn().then(d => Array.isArray(d) ? d : []).catch(() => []);

    Promise.all([
      safeFetch(() => EmployeeService.getAllEmployees()),
      safeFetch(() => PayrollService.getAllPayroll()),
      safeFetch(() => BonusService.getAllBonus()),
      safeFetch(() => AllowanceService.getAllAllowance()),
      safeFetch(() => DeductionService.getAllDeduction()),
      safeFetch(() => OvertimeService.getAllOvertime()),
      safeFetch(() => LeaveService.getAllEmployeeLeave()),
    ]).then(([emps, pays, bons, alls, deds, ovts, lvs]) => {
      setEmployees(emps);
      setPayrolls(pays);
      setBonuses(bons);
      setAllowances(alls);
      setDeductions(deds);
      setOvertimes(ovts);
      setLeaves(lvs);
      setLoading(false);
    });
  }, []);

  /* ── Derived stats ── */
  const activeEmps = employees.filter(e => e.status === "ACTIVE").length;
  const inactiveEmps = employees.filter(e => e.status === "INACTIVE").length;
  const totalBasic = employees.reduce((s, e) => s + Number(e.basicSalary || 0), 0);
  const totalBonus = bonuses.reduce((s, b) => s + Number(b.amount || 0), 0);
  const totalAllowance = allowances.reduce((s, a) => s + Number(a.amount || 0), 0);
  const totalDeduction = deductions.reduce((s, d) => s + Number(d.amount || 0), 0);
  const totalOvertime = overtimes.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const netPayroll = totalBasic + totalBonus + totalAllowance + totalOvertime - totalDeduction;

  const pendingLeaves = leaves.filter(l => (l.status || "").toUpperCase() === "PENDING").length;
  const approvedLeaves = leaves.filter(l => (l.status || "").toUpperCase() === "APPROVED").length;

  /* ── Department breakdown ── */
  const deptMap = {};
  employees.forEach(e => {
    const d = e.department || "Other";
    deptMap[d] = (deptMap[d] || 0) + 1;
  });
  const deptEntries = Object.entries(deptMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const deptColors = ["#4f8ef7", "#a78bfa", "#34d399", "#fb923c", "#f472b6", "#60a5fa"];

  /* ── Recent employees ── */
  const recentEmps = [...employees].slice(-5).reverse();

  /* ── Payroll summary donut ── */
  const donutSegs = [
    { label: "Basic", value: totalBasic, color: "#4f8ef7" },
    { label: "Bonus", value: totalBonus, color: "#34d399" },
    { label: "Allowance", value: totalAllowance, color: "#a78bfa" },
    { label: "Overtime", value: totalOvertime, color: "#fb923c" },
    { label: "Deduction", value: totalDeduction, color: "#f87171" },
  ].filter(s => s.value > 0);

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "LKR", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);
  const fmtK = (n) => n >= 1000 ? `Rs.${(n / 1000).toFixed(1)}k` : `Rs.${n}`;

  const mkSpark = (total, len = 7) => Array.from({ length: len }, (_, i) =>
    Math.max(1, Math.round((total / len) * (0.6 + 0.8 * Math.random())))
  );

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
        <div>Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="dash-topbar">
        <div>
          <h1 className="dash-title">
            <i className="bi bi-speedometer2 me-2" />Dashboard
          </h1>
          <div className="dash-date">
            {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
        <div className="dash-topbar-right">
          <div className="dash-badge-pill blue">
            <i className="bi bi-people-fill" /> {employees.length} Employees
          </div>
          <div className="dash-badge-pill green">
            <i className="bi bi-check-circle-fill" /> {activeEmps} Active
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon="bi-people-fill" label="Total Employees" value={employees.length} sub={`${activeEmps} active · ${inactiveEmps} inactive`} color="#4f8ef7" spark={mkSpark(employees.length)} delay={0} />
        <StatCard icon="bi-cash-stack" label="Net Payroll" value={fmtK(netPayroll)} sub="Earnings - Deductions" color="#34d399" spark={mkSpark(netPayroll)} delay={60} />
        <StatCard icon="bi-gift-fill" label="Total Bonuses" value={fmtK(totalBonus)} sub={`${bonuses.length} records`} color="#a78bfa" spark={mkSpark(totalBonus)} delay={120} />
        <StatCard icon="bi-clock-history" label="Overtime" value={fmtK(totalOvertime)} sub={`${overtimes.length} entries`} color="#fb923c" spark={mkSpark(totalOvertime)} delay={180} />
        <StatCard icon="bi-dash-circle-fill" label="Total Deductions" value={fmtK(totalDeduction)} sub={`${deductions.length} records`} color="#f87171" spark={mkSpark(totalDeduction)} delay={240} />
        <StatCard icon="bi-calendar2-x-fill" label="Leave Requests" value={leaves.length} sub={`${pendingLeaves} pending · ${approvedLeaves} approved`} color="#f472b6" spark={mkSpark(leaves.length)} delay={300} />
      </div>

      <div className="dash-row2">
        <div className="dash-card payroll-comp">
          <SectionHead icon="bi-pie-chart-fill" title="Payroll Composition" subtitle="Breakdown of all salary components" color="#4f8ef7" />
          <div className="payroll-comp-body">
            <div className="donut-wrap">
              <DonutChart segments={donutSegs} />
              <div className="donut-center-label">
                <div className="donut-total">{fmtK(netPayroll)}</div>
                <div className="donut-sub">Net Total</div>
              </div>
            </div>
            <div className="comp-legend">
              {[
                { label: "Basic Salary", value: totalBasic, color: "#4f8ef7", icon: "bi-cash-coin" },
                { label: "Bonus", value: totalBonus, color: "#34d399", icon: "bi-gift-fill" },
                { label: "Allowance", value: totalAllowance, color: "#a78bfa", icon: "bi-plus-circle-fill" },
                { label: "Overtime", value: totalOvertime, color: "#fb923c", icon: "bi-clock-history" },
                { label: "Deductions", value: -totalDeduction, color: "#f87171", icon: "bi-dash-circle-fill" },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="comp-row">
                  <div className="comp-dot" style={{ background: color }} />
                  <i className={`bi ${icon}`} style={{ color, fontSize: "12px" }} />
                  <span className="comp-label">{label}</span>
                  <span className="comp-val" style={{ color }}>{fmt(value)}</span>
                </div>
              ))}
              <div className="comp-net-row">
                <span>Net Payroll</span>
                <span className="comp-net-val">{fmt(netPayroll)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dash-card dept-card">
          <SectionHead icon="bi-diagram-3-fill" title="Departments" subtitle="Headcount by department" color="#a78bfa" />
          <div className="dept-body">
            {deptEntries.length === 0 ? (
              <div className="empty-mini">No department data</div>
            ) : (
              deptEntries.map(([dept, count], i) => (
                <HBar key={dept} label={dept} value={count} max={deptEntries[0][1]} color={deptColors[i % deptColors.length]} />
              ))
            )}
          </div>
          <div className="dept-donut-row">
            {deptEntries.map(([dept, count], i) => (
              <div key={dept} className="dept-pill" style={{ borderColor: deptColors[i % deptColors.length], color: deptColors[i % deptColors.length] }}>
                {dept} <strong>{count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-row3">
        <div className="dash-card recent-emp-card">
          <SectionHead icon="bi-person-lines-fill" title="Recent Employees" subtitle="Latest additions" color="#34d399" />
          <div className="emp-list">
            {recentEmps.length === 0 ? (
              <div className="empty-mini">No employees found</div>
            ) : recentEmps.map((emp, i) => (
              <div key={emp.id ?? i} className="emp-list-row" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="emp-list-avatar">
                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                </div>
                <div className="emp-list-info">
                  <div className="emp-list-name">{emp.firstName} {emp.lastName}</div>
                  <div className="emp-list-meta">{emp.designation || emp.department || "—"}</div>
                </div>
                <div className="emp-list-right">
                  <div className="emp-list-salary">{fmtK(Number(emp.basicSalary || 0))}</div>
                  <span className={`status-dot-badge ${emp.status === "ACTIVE" ? "active" : "inactive"}`}>
                    {emp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card leave-card">
          <SectionHead icon="bi-calendar2-week-fill" title="Leave Summary" subtitle="Current leave status" color="#f472b6" />
          <div className="leave-body">
            {[
              { label: "Total Requests", value: leaves.length, color: "#4f8ef7", icon: "bi-list-ul" },
              { label: "Pending", value: pendingLeaves, color: "#fb923c", icon: "bi-hourglass-split" },
              { label: "Approved", value: approvedLeaves, color: "#34d399", icon: "bi-check-circle-fill" },
              { label: "Rejected", value: leaves.filter(l => (l.status || "").toUpperCase() === "REJECTED").length, color: "#f87171", icon: "bi-x-circle-fill" },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="leave-stat-row">
                <div className="leave-stat-icon" style={{ background: color + "22", color }}>
                  <i className={`bi ${icon}`} />
                </div>
                <div className="leave-stat-label">{label}</div>
                <div className="leave-stat-val" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card quick-card">
          <SectionHead icon="bi-bar-chart-fill" title="Quick Numbers" subtitle="At a glance totals" color="#fb923c" />
          <div className="quick-body">
            {[
              { label: "Payroll Records", value: payrolls.length, icon: "bi-receipt-cutoff", color: "#4f8ef7" },
              { label: "Bonus Records", value: bonuses.length, icon: "bi-gift-fill", color: "#a78bfa" },
              { label: "Deduction Records", value: deductions.length, icon: "bi-dash-circle-fill", color: "#f87171" },
              { label: "Allowance Records", value: allowances.length, icon: "bi-plus-circle-fill", color: "#34d399" },
              { label: "Overtime Records", value: overtimes.length, icon: "bi-clock-history", color: "#fb923c" },
              { label: "Leave Records", value: leaves.length, icon: "bi-calendar2-x-fill", color: "#f472b6" },
            ].map(({ label, value, icon, color }, i) => (
              <div key={label} className="quick-row" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="quick-icon" style={{ background: color + "20", color }}>
                  <i className={`bi ${icon}`} />
                </div>
                <div className="quick-label">{label}</div>
                <div className="quick-val" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>
          <div className="net-hero">
            <div className="net-hero-label">Total Net Payroll</div>
            <div className="net-hero-val">{fmt(netPayroll)}</div>
            <div className="net-hero-sub">Basic + Bonus + Allowance + Overtime − Deductions</div>
          </div>
        </div>
      </div>
    </div>
  );
}