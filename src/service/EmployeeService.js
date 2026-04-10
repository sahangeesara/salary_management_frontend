const API_URL = "http://localhost:8080/api/employees";

class EmployeeService {
  // Get all employees
  getAllEmployees() {
    return fetch(`${API_URL}/get-all`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .catch(err => {
        console.error("Fetch error (getAllEmployees):", err);
        return [];
      });
  }

  // Get employee by ID
  getEmployeeById(id) {
    return fetch(`${API_URL}/getById/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .catch(err => {
        console.error("Fetch error (getEmployeeById):", err);
        return null;
      });
  }

  // Create new employee
  createEmployee(employee) {
    return fetch(`${API_URL}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee)
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .catch(err => {
        console.error("Fetch error (createEmployee):", err);
        return null;
      });
  }

  // Update employee (full update)
  updateEmployee(employee) {
    return fetch(`${API_URL}/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee)
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .catch(err => {
        console.error("Fetch error (updateEmployee):", err);
        return null;
      });
  }

  // Partial update by ID (allowance, bonus, donation, status)
  updateEmployeeById(id, employee) {
    return fetch(`${API_URL}/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee)
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .catch(err => {
        console.error("Fetch error (updateEmployeeById):", err);
        return null;
      });
  }

  // Delete employee
  deleteEmployee(id) {
    return fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return true;
      })
      .catch(err => {
        console.error("Fetch error (deleteEmployee):", err);
        return false;
      });
  }
}

const employeeService = new EmployeeService();
export default employeeService;
