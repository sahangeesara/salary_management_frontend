const API_URL = "http://localhost:8080/api/departments";

class DepartmentService {
  getAllDepartments() {
    return fetch(`${API_URL}/get-all`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .catch(err => {
        console.error("Fetch error (departments):", err);
        return [];
      });
  }

    //  Create new department
    createDepartment(department) {
        return fetch(`${API_URL}/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(department)
        }).then(res => res.json());
    }

    //  Update department
    updateDepartment(department) {
        return fetch(`${API_URL}/update`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(department)
        }).then(res => res.json());
    }


    //  Delete department
    deleteDepartment(id) {
        return fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });
    }
}

const departmentService = new DepartmentService();
export default departmentService;

