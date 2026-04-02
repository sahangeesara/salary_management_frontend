const API_URL = "http://localhost:8080/api/payroll";

class PayrollService {

  //  Get all Payrolls
  getAllPayroll() {
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

      //  Create new Payroll
      createPayroll(payroll) {
        return fetch(`${API_URL}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payroll)
        }).then(res => res.json());
      }

      //  Update Payroll
      updatePayroll(payroll) {
        return fetch(`${API_URL}/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payroll)
        }).then(res => res.json());
      }


      //  Delete Payroll
      deletePayroll(id) {
        return fetch(`${API_URL}/${id}`, {
          method: "DELETE"
        });
      }

      getPayrollByEmployeeId(id) {
        return fetch(`${API_URL}/getById/${id}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`Server error: ${res.status}`);
            }
            return res.json();
          })
          .catch(err => {
            console.error("Fetch error:", err);
            return null; 
          });
      }
      getTotalBonus(id) {
        return fetch(`${API_URL}/totalBonus/${id}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`Server error: ${res.status}`);
            }
            return res.json();
          })
          .catch(err => {
            console.error("Fetch error:", err);
            return null; 
          });
      }
      
      getTotalDonation(id) {
        return fetch(`${API_URL}/totalDonation/${id}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`Server error: ${res.status}`);
            }
            return res.json();
          })
          .catch(err => {
            console.error("Fetch error:", err);
            return null; 
          });
      }
      getTotalOvertime(id) {
        return fetch(`${API_URL}/totalOvertime/${id}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`Server error: ${res.status}`);
            }
            return res.json();
          })
          .catch(err => {
            console.error("Fetch error:", err);
            return null; 
          });
      }
      
      getTotalLaveDays(id) {
        return fetch(`${API_URL}/totalLaveDays/${id}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`Server error: ${res.status}`);
            }
            return res.json();
          })
          .catch(err => {
            console.error("Fetch error:", err);
            return null; 
          });
      }
      getTotalEPF(id) {
        return fetch(`${API_URL}/totalEPF/${id}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`Server error: ${res.status}`);
            }
            return res.json();
          })
          .catch(err => {
            console.error("Fetch error:", err);
            return null; 
          });
      }
      getTotalETF(id) {
        return fetch(`${API_URL}/totalETF/${id}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`Server error: ${res.status}`);
            }
            return res.json();
          })
          .catch(err => {
            console.error("Fetch error:", err);
            return null; 
          });
      }
      getTotalAllowances(id) {
        return fetch(`${API_URL}/totalAllowances/${id}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`Server error: ${res.status}`);
            }
            return res.json();
          })
          .catch(err => {
            console.error("Fetch error:", err);
            return null; 
          });
      }


}

const payrollService = new PayrollService();
export default payrollService;