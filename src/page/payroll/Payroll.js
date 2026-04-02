import React, { useState, useEffect, useCallback, memo } from "react";
import PayrollService from "../../service/PayrollService";
import EmployeeService from "../../service/EmployeeService";
import "./payroll.css";

const EMPTY_FORM = {
  employeeId: "",
  basicSalary: "",
  epfEmployee: "",
  epfEmployer: "",
  etfEmployer: "",
  allowance: "",
  bonus: "",
  donation: "",
  overtimeAmount: "",
  leaveDays: "",
  leaveDeduction: "",
  totalDeduction: "",
  netSalary: "",
  employerCost: "",
  payrollDate: new Date().toISOString().split('T')[0]
};

const PayrollRow = memo(({ payroll, index, onEdit, onDelete, employees }) => {
  const emp = employees.find(e => String(e.id ?? e.employeeId) === String(payroll.employeeId));
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${payroll.employeeId}`;

  return (
    <tr style={{ animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${index * 40}ms` }}>
      <td><span className="emp-index">{String(index + 1).padStart(2, "0")}</span></td>
      <td>
        <div className="emp-name-cell">
          <div className="emp-avatar">{empName[0]}</div>
          <div>
            <div className="emp-fullname">{empName}</div>
            <div className="emp-dept-tag">Date: {payroll.payrollDate}</div>
          </div>
        </div>
      </td>
      <td><span className="emp-meta">ID: {payroll.employeeId}</span></td>
      <td>
        <span className="salary-pill">
          <i className="bi bi-cash-stack me-1" />
          {Number(payroll.netSalary || 0).toLocaleString()}
        </span>
      </td>
      <td><span className="text-danger">-{Number(payroll.totalDeduction || 0).toLocaleString()}</span></td>
      <td>{payroll.leaveDays || 0} Days</td>
      <td>
        <div className="action-group">
          <button className="action-btn edit-btn" onClick={() => onEdit(payroll)} title="Edit">
            <i className="bi bi-pencil-fill" />
          </button>
          <button className="action-btn delete-btn" onClick={() => onDelete(payroll)} title="Delete">
            <i className="bi bi-trash3-fill" />
          </button>
        </div>
      </td>
    </tr>
  );
});

const DeleteModal = memo(({ payroll, onConfirm, onCancel }) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
      <div className="confirm-icon"><i className="bi bi-exclamation-triangle-fill" /></div>
      <h5>Delete Payroll Record?</h5>
      <p>Are you sure you want to remove the payroll for <strong>ID: {payroll?.employeeId}</strong>?</p>
      <div className="confirm-actions">
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="btn-confirm-delete" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
));

function Payroll() {
  const [payrollList, setPayrollList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [populating, setPopulating] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pData, eData] = await Promise.all([
        PayrollService.getAllPayroll(),
        EmployeeService.getAllEmployees()
      ]);
      setPayrollList(Array.isArray(pData) ? pData : []);
      setEmployees(Array.isArray(eData) ? eData : []);
    } catch (err) {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-populate all payroll fields when an employee is selected from dropdown
  const populatePayrollForEmployee = useCallback(async (employeeId) => {
    if (!employeeId) return;
    setPopulating(true);

    const safeGet = async (promise, fallback) => {
      try { return (await promise) ?? fallback; }
      catch { return fallback; }
    };

    try {
      const id = Number(employeeId);

      const [employee, bonus, donation, overtime, leaveDays, epf, etf, allowances] =
        await Promise.all([
          safeGet(EmployeeService.getEmployeeById(id), null),
          safeGet(PayrollService.getTotalBonus(id), 0),
          safeGet(PayrollService.getTotalDonation(id), 0),
          safeGet(PayrollService.getTotalOvertime(id), 0),
          safeGet(PayrollService.getTotalLaveDays(id), 0),
          safeGet(PayrollService.getTotalEPF(id), { employee: 0, employer: 0 }),
          safeGet(PayrollService.getTotalETF(id), { employer: 0 }),
          safeGet(PayrollService.getTotalAllowances(id), 0),
        ]);

      // Normalize EPF / ETF shapes
      const epfEmployeeValue = epf?.employeeEPF ?? epf?.employee ?? 0;
      const epfEmployerValue = epf?.employerEPF ?? epf?.employer ?? 0;
      const etfEmployerValue = etf?.etf          ?? etf?.employer  ?? 0;

      // Base values — prefer API totals, fall back to employee record, then 0
      const basicSalary    = employee?.basicSalary ?? 0;
      const allowance      = allowances            ?? employee?.allowance  ?? 0;
      const bonusAmount    = bonus                 ?? employee?.bonus      ?? 0;
      const donationAmount = donation              ?? employee?.donation   ?? 0;
      const overtimeAmount = overtime              ?? 0;
      const leaveDaysAmt   = leaveDays             ?? 0;

      // Derived calculations (mirror Angular logic exactly)
      const leaveDeduction = leaveDaysAmt * (basicSalary / 30);
      const totalDeduction = epfEmployeeValue + leaveDeduction;

      const netSalary =
        basicSalary + allowance + bonusAmount + donationAmount + overtimeAmount - totalDeduction;

      const employerCost =
        basicSalary + epfEmployerValue + etfEmployerValue +
        allowance + bonusAmount + donationAmount + overtimeAmount;

      setForm(prev => ({
        ...prev,
        employeeId,
        basicSalary,
        epfEmployee:    epfEmployeeValue,
        epfEmployer:    epfEmployerValue,
        etfEmployer:    etfEmployerValue,
        allowance,
        bonus:          bonusAmount,
        donation:       donationAmount,
        overtimeAmount,
        leaveDays:      leaveDaysAmt,
        leaveDeduction: leaveDeduction.toFixed(2),
        totalDeduction: totalDeduction.toFixed(2),
        netSalary:      netSalary.toFixed(2),
        employerCost:   employerCost.toFixed(2),
      }));

    } catch (err) {
      showToast("Failed to populate employee data", "error");
    } finally {
      setPopulating(false);
    }
  }, [showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // Fire auto-populate whenever the employee dropdown changes
    if (name === "employeeId" && value) {
      populatePayrollForEmployee(value);
    }
  };

  const handleClear = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, []);

  const handleEdit = useCallback((p) => {
    setForm({ ...p });
    setEditingId(p.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const action = editingId
      ? PayrollService.updatePayroll({ ...form, id: editingId })
      : PayrollService.createPayroll(form);

    action
      .then(() => {
        fetchData();
        showToast(editingId ? "Payroll updated!" : "Payroll generated!");
        handleClear();
      })
      .catch(() => showToast("Operation failed", "error"))
      .finally(() => setLoading(false));
  };

  const filtered = payrollList.filter(p => String(p.employeeId).includes(search));
  const isEdit = editingId !== null;

  return (
    <div className="emp-page">
      {toast && (
        <div className={`toast-bar ${toast.type}`}>
          <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} />
          {toast.msg}
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          payroll={deleteTarget}
          onConfirm={() => {
            PayrollService.deletePayroll(deleteTarget.id)
              .then(() => { fetchData(); showToast("Payroll deleted!"); })
              .catch(() => showToast("Delete failed", "error"))
              .finally(() => setDeleteTarget(null));
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="emp-header">
        <h2><i className="bi bi-wallet2 me-2" style={{ color: "#3b62f6" }} />Payroll Management</h2>
        <span className="emp-count">{payrollList.length} Records</span>
      </div>

      <div className="emp-card">
        <div className="emp-card-header">
          <div className="card-icon blue"><i className="bi bi-calculator" /></div>
          <div>
            <div className="card-title">{isEdit ? "Edit Payroll" : "New Payroll Calculation"}</div>
            <div className="card-subtitle">Select an employee to auto-fill all financial fields</div>
          </div>
          <span className={`mode-tag ${isEdit ? "edit" : "create"}`}>
            {isEdit ? "Edit Mode" : "Generate Mode"}
          </span>
        </div>

        <form className="emp-form-body" onSubmit={handleSubmit}>
          <div className="row g-3">

            {/* ── Employee Dropdown ── */}
            <div className="col-md-4">
              <label className="form-label-sm">
                Employee
                {populating && (
                  <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "#3b62f6" }}>
                    <i className="bi bi-arrow-repeat spin me-1" />Auto-filling…
                  </span>
                )}
              </label>
              <select
                name="employeeId"
                className="emp-input"
                value={form.employeeId}
                onChange={handleChange}
                required
                disabled={isEdit}   // lock employee selection in edit mode
              >
                <option value="">— Select Employee —</option>
                {employees.map(emp => {
                  const id = emp.id ?? emp.employeeId;
                  return (
                    <option key={id} value={id}>
                      {emp.firstName} {emp.lastName} &nbsp;(ID: {id})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label-sm">Payroll Date</label>
              <input type="date" name="payrollDate" className="emp-input" value={form.payrollDate} onChange={handleChange} required />
            </div>
            <div className="col-md-4">
              <label className="form-label-sm">Basic Salary</label>
              <input type="number" name="basicSalary" className="emp-input" value={form.basicSalary} onChange={handleChange} required />
            </div>

            <div className="col-md-3">
              <label className="form-label-sm">EPF Employee</label>
              <input type="number" name="epfEmployee" className="emp-input" value={form.epfEmployee} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label-sm">EPF Employer</label>
              <input type="number" name="epfEmployer" className="emp-input" value={form.epfEmployer} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label-sm">ETF Employer</label>
              <input type="number" name="etfEmployer" className="emp-input" value={form.etfEmployer} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label-sm">Allowance</label>
              <input type="number" name="allowance" className="emp-input" value={form.allowance} onChange={handleChange} />
            </div>

            <div className="col-md-3">
              <label className="form-label-sm">Bonus</label>
              <input type="number" name="bonus" className="emp-input" value={form.bonus} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label-sm">Donation</label>
              <input type="number" name="donation" className="emp-input" value={form.donation} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label-sm">Overtime Amount</label>
              <input type="number" name="overtimeAmount" className="emp-input" value={form.overtimeAmount} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label-sm">Leave Days</label>
              <input type="number" name="leaveDays" className="emp-input" value={form.leaveDays} onChange={handleChange} />
            </div>

            <div className="col-md-3">
              <label className="form-label-sm text-danger">Leave Deduction</label>
              <input type="number" name="leaveDeduction" className="emp-input border-danger" value={form.leaveDeduction} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label-sm text-danger">Total Deduction</label>
              <input type="number" name="totalDeduction" className="emp-input border-danger" value={form.totalDeduction} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label-sm text-primary">Net Salary</label>
              <input type="number" name="netSalary" className="emp-input border-primary" value={form.netSalary} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label-sm">Employer Cost</label>
              <input type="number" name="employerCost" className="emp-input" value={form.employerCost} onChange={handleChange} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className={isEdit ? "btn-update" : "btn-save"} disabled={loading || populating}>
              <i className="bi bi-check-circle" /> {isEdit ? "Update Record" : "Save Record"}
            </button>
            <button type="button" className="btn-clear" onClick={handleClear}>
              <i className="bi bi-arrow-counterclockwise" /> Clear
            </button>
          </div>
        </form>
      </div>

      <div className="emp-card mt-4">
        <div className="emp-card-header">
          <div className="card-icon green"><i className="bi bi-table" /></div>
          <div className="search-wrap ms-auto">
            <i className="bi bi-search" />
            <input
              className="search-input"
              placeholder="Search by Employee ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="emp-table-wrap">
          <table className="emp-table">
            <thead>
              <tr>
                <th>#</th><th>Employee</th><th>Emp ID</th><th>Net Salary</th>
                <th>Deductions</th><th>Leave</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <PayrollRow
                  key={p.id || i}
                  payroll={p}
                  index={i}
                  employees={employees}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { display: inline-block; animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}

export default Payroll;