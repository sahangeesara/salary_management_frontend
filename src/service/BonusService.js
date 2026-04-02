const API_URL = "http://localhost:8080/api/bonus";

class BonusService {

  //  Get all Bonuss
  getAllBonus() {
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

      //  Create new Bonus
      createBonus(bonus) {
        return fetch(`${API_URL}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(bonus)
        }).then(res => res.json());
      }

      //  Update Bonus
      updateBonus(bonus) {
        return fetch(`${API_URL}/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(bonus)
        }).then(res => res.json());
      }


      //  Delete Bonus
      deleteBonus(id) {
        return fetch(`${API_URL}/${id}`, {
          method: "DELETE"
        });
      }

}

const bonusService = new BonusService();
export default bonusService;