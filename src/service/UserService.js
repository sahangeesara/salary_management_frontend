const API_URL = "http://localhost:8080/api/users";

class UserService {

    //  Get all users
    getAllUsers() {
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

    //  Create new user
    createUser(user) {
        return fetch(`${API_URL}/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(user)
        }).then(res => res.json());
      }

}

const userService = new UserService();
export default  userService;