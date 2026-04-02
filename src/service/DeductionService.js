const API_URL = "http://localhost:8080/api/deduction";

class DeductionService {

  //  Get all Deductions
  getAllDeduction() {
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

      //  Create new Deduction
      createDeduction(deduction) {
        return fetch(`${API_URL}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(deduction)
        }).then(res => res.json());
      }

      //  Update Deduction
      updateDeduction(deduction) {
        return fetch(`${API_URL}/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(deduction)
        }).then(res => res.json());
      }


      //  Delete Deduction
      deleteDeduction(id) {
        return fetch(`${API_URL}/${id}`, {
          method: "DELETE"
        });
      }

}

const deductionService = new DeductionService();
export default deductionService;