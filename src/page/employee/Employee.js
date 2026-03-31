import React, { useState, useEffect } from "react"; 
import EmployeeService from "../../service/EmployeeService";
function Employee() {
const [employees, setEmployees] = useState([]);

const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    basicSalary: "",
    department: "",
    designation: "",
    status: "ACTIVE",
  });

  useEffect(() => {
      fetchEmployees();
    }, []);
      
    const fetchEmployees = () => {
        EmployeeService.getAllEmployees()
          .then((data) => {
            // Handle cases where the backend might return null or unexpected data
            setEmployees(Array.isArray(data) ? data : []);
            })
            .catch((err) => console.error("Initial load failed:", err));
    };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

    const handleSubmit = (e) => {
      e.preventDefault();

    EmployeeService.createEmployee(form)
      .then(() => {
        fetchEmployees(); 
        
      })
      .catch((err) => console.error(err));


      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        basicSalary: "",
        department: "",
        designation: "",
        status: "ACTIVE",
      });
    };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Employee Management</h2>

      {/* Form */}
      <form className="card p-3 mb-4" onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-md-6">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              className="form-control"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className="form-control"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              className="form-control"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <input
              type="number"
              name="basicSalary"
              placeholder="Basic Salary"
              className="form-control"
              value={form.basicSalary}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <input
              type="text"
              name="department"
              placeholder="Department"
              className="form-control"
              value={form.department}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <input
              type="text"
              name="designation"
              placeholder="Designation"
              className="form-control"
              value={form.designation}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <select
              name="status"
              className="form-select"
              value={form.status}
              onChange={handleChange}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        <div className="col-md-4">
        <button className="btn btn-primary mt-3">Save</button>&nbsp;&nbsp;
        <button className="btn btn-light mt-3"> Clear</button>
        </div>

      </form>

      {/* Table */}
      <div className="card p-3">
        <h5>Employee List</h5>

        <table className="table table-bordered table-hover mt-3">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Salary</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">
                  No data
                </td>
              </tr>
            ) : (
              employees.map((emp, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{emp.firstName} {emp.lastName}</td>
                  <td>{emp.email}</td>
                  <td>{emp.phone}</td>
                  <td>{emp.basicSalary}</td>
                  <td>{emp.department}</td>
                  <td>{emp.designation}</td>
                  <td>{emp.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Employee;