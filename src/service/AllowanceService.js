const API_URL = "http://localhost:8080/api/allowance";

class AllowanceService {

  //  Get all allowances
  getAllAllowance() {
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

      //  Create new allowance
      createAllowance(allowance) {
        return fetch(`${API_URL}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(allowance)
        }).then(res => res.json());
      }

      //  Update allowance
      updateAllowance(allowance) {
        return fetch(`${API_URL}/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(allowance)
        }).then(res => res.json());
      }


      //  Delete allowance
      deleteAllowance(id) {
        return fetch(`${API_URL}/${id}`, {
          method: "DELETE"
        });
      }

}

const allowanceService = new AllowanceService();
export default allowanceService;