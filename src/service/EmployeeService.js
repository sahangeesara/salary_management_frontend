const API_URL = "http://localhost:8080/api/employees";

class EmployeeService {

  //  Get all employees
  getAllEmployees() {
      return fetch(`${API_URL}/get-all`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
          }
          return res.json();
        })
        .catch(err => {
          console.error("Fetch error:", err);
          return []; 
        });
    }

      getEmployeeById(id) {
        return fetch(`${API_URL}/getById/${id}`)
          .then(res =>{ return res.json()});
      }

      //  Create new employee
      createEmployee(employee) {
        return fetch(`${API_URL}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(employee)
        }).then(res => res.json());
      }

      //  Update employee
      updateEmployee(employee) {
        return fetch(`${API_URL}/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(employee)
        }).then(res => res.json());
      }

        //  Update by ID
        updateEmployeeById(id, employee) {
          return fetch(`${API_URL}/update/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(employee)
          }).then(res => res.json());
        }

      //  Delete employee
      deleteEmployee(id) {
        return fetch(`${API_URL}/${id}`, {
          method: "DELETE"
        });
      }

}

const employeeService = new EmployeeService();
export default employeeService;