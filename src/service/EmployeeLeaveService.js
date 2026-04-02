const API_URL = "http://localhost:8080/api/employee-leave";

class EmployeeLeaveService {

  //  Get all EmployeeLeaves
  getAllEmployeeLeave() {
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

      //  Create new EmployeeLeave
      createEmployeeLeave(employeeLeave) {
        return fetch(`${API_URL}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(employeeLeave)
        }).then(res => res.json());
      }

      //  Update EmployeeLeave
      updateEmployeeLeave(employeeLeave) {
        return fetch(`${API_URL}/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(employeeLeave)
        }).then(res => res.json());
      }


      //  Delete EmployeeLeave
      deleteEmployeeLeave(id) {
        return fetch(`${API_URL}/${id}`, {
          method: "DELETE"
        });
      }

}

const employeeLeaveService = new EmployeeLeaveService();
export default employeeLeaveService;