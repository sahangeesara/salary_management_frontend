// No content change, just renaming file to remove space before .js
const API_URL = "http://localhost:8080/api/overtime";

class OvertimeService {

  //  Get all Overtimes
  getAllOvertime() {
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

      //  Create new Overtime
      createOvertime(overtime) {
        return fetch(`${API_URL}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(overtime)
        }).then(res => res.json());
      }

      //  Update Overtime
      updateOvertime(overtime) {
        return fetch(`${API_URL}/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(overtime)
        }).then(res => res.json());
      }


      //  Delete Overtime
      deleteOvertime(id) {
        return fetch(`${API_URL}/${id}`, {
          method: "DELETE"
        });
      }

}

const overtimeService = new OvertimeService();
export default overtimeService;
