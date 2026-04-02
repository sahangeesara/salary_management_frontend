const API_URL = "http://localhost:8080/api/payroll-config";

class PayrollConfigService {

  //  Get all PayrollConfig
  getAllPayrollConfig() {
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

      //  Create new PayrollConfig
      createPayrollConfig(payrollConfig) {
        return fetch(`${API_URL}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payrollConfig)
        }).then(res => res.json());
      }

      //  Update PayrollConfig
      updatePayrollConfig(payrollConfig) {
        return fetch(`${API_URL}/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payrollConfig)
        }).then(res => res.json());
      }


      //  Delete PayrollConfig
      deletePayrollConfig(id) {
        return fetch(`${API_URL}/${id}`, {
          method: "DELETE"
        });
      }

}

const payrollConfigService = new PayrollConfigService();
export default payrollConfigService;