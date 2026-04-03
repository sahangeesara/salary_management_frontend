const API_URL = "http://localhost:8080/api/users";

class UserService {

  // Get all Users
  getAllUsers() {
    return fetch(`${API_URL}/get-all`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .catch(err => {
        console.error("Fetch error:", err);
        return [];
      });
  }

  // Create new User
  createUser(user) {
    return fetch(`${API_URL}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    }).then(res => {
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    });
  }

  // Update User
  updateUser(user) {
    return fetch(`${API_URL}/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    }).then(res => {
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    });
  }

  // Delete User
  deleteUser(id) {
    return fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    }).then(res => {
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res;
    });
  }
}

const userService = new UserService();
export default userService;