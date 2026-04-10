const API_URL = "http://localhost:8080/api/designations";

class DesignationService {
    getAllDesignations() {
        return fetch(`${API_URL}/get-all`)
            .then(res => {
                if (!res.ok) throw new Error(`Server error: ${res.status}`);
                return res.json();
            })
            .catch(err => {
                console.error("Fetch error (designations):", err);
                return [];
            });
    }

    //  Create new designation
    createDesignation(designation) {
        return fetch(`${API_URL}/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(designation)
        })
            .then(async res => {
                if (!res.ok) {
                    // This will catch the 400 error and show the message from Spring Boot
                    const errorData = await res.json();
                    throw new Error(errorData.message || `Server error: ${res.status}`);
                }
                return res.json();
            })
            .catch(err => {
                console.error("Creation failed:", err);
                throw err; // Re-throw so the UI can show an alert
            });
    }

    //  Update designation
    updateDesignation(designation) {
        return fetch(`${API_URL}/update`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(designation)
        }).then(res => res.json());
    }


    //  Delete designation
    deleteDesignation(id) {
        return fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });
    }
}

const designationService = new DesignationService();
export default designationService;

