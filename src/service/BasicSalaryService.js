const API_URL = "http://localhost:8080/api/besic-salary";

class BasicSalaryService {

  //  Get all BasicSalarys
  getAllBasicSalary() {
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

      //  Create new BasicSalary
      createBasicSalary(basicSalary) {
        return fetch(`${API_URL}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(basicSalary)
        }).then(res => res.json());
      }

      //  Update BasicSalary
      updateBasicSalary(basicSalary) {
        return fetch(`${API_URL}/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(basicSalary)
        }).then(res => res.json());
      }


      //  Delete BasicSalary
      deleteBasicSalary(id) {
        return fetch(`${API_URL}/${id}`, {
          method: "DELETE"
        });
      }

}

const basicSalaryService = new BasicSalaryService();
export default basicSalaryService;