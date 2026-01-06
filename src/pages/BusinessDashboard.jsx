import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { apiRequest } from '../services/api';
import './BusinessDashboard.css';

const BusinessDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  
  // New Load Form State
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    cargoType: "",
    vehicleTypeRequired: "",
    weight: "",
    price: "",
    pickupDate: ""
  });

  const fetchData = async () => {
    try {
      // Fetch Profile
      const profileData = await apiRequest("/business/profile/me");
      setProfile(profileData);

      // Fetch My Loads
      const loadsData = await apiRequest("/loads/my-loads");
      setLoads(loadsData);

    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitLoad = async (e) => {
    e.preventDefault();
    try {
      await apiRequest("/loads", {
        method: "POST",
        body: JSON.stringify(formData)
      });

      toast.success("Load posted successfully!");
      setShowForm(false);
      setFormData({ origin: "", destination: "", cargoType: "", weight: "", price: "", pickupDate: "" });
      fetchData(); // Refresh list
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAssign = async (loadId, truckerId) => {
      try {
          await apiRequest(`/loads/${loadId}/assign`, {
              method: "PATCH",
              body: JSON.stringify({ truckerId }) // In this simple flow, backend knows the matched trucker, but good to be explicit if we had multiple applicants
          });
          toast.success("Trucker assigned!");
          fetchData();
      } catch (err) {
          toast.error(err.message);
      }
  };

  const handleClose = async (loadId) => {
      try {
          await apiRequest(`/loads/${loadId}/close`, { method: "PATCH" });
          toast.success("Load closed!");
          fetchData();
      } catch (err) {
          toast.error(err.message);
      }
  };

  const handleCancel = async (loadId) => {
      if(!window.confirm("Are you sure you want to cancel this load?")) return;
      try {
          await apiRequest(`/loads/${loadId}/cancel`, { method: "PATCH" });
          toast.info("Load cancelled.");
          fetchData();
      } catch (err) {
          toast.error(err.message);
      }
  };

  if (loading) return <div className="dashboard-container">Loading...</div>;
  if (error) return <div className="dashboard-container">Error: {error}</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>{profile?.businessName || "Business Dashboard"}</h1>
        <div className="dashboard-actions">
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Post a New Load"}
          </button>
        </div>
      </header>

      {showForm && (
        <section className="post-load-section">
          <h2>Post New Shipment</h2>
          <form className="post-load-form" onSubmit={handleSubmitLoad}>
            <div className="form-grid">
              <input name="origin" placeholder="Origin (e.g. Mumbai)" onChange={handleInputChange} required />
              <input name="destination" placeholder="Destination (e.g. Delhi)" onChange={handleInputChange} required />
              <input name="cargoType" placeholder="Cargo Type (e.g. Electronics)" onChange={handleInputChange} required />
              <input name="vehicleTypeRequired" placeholder="Required Truck Type (e.g. Semi-Truck)" onChange={handleInputChange} required />
              <input name="weight" type="number" placeholder="Max Weight (Tons)" onChange={handleInputChange} required />
              <input name="price" type="number" placeholder="Price (₹)" onChange={handleInputChange} required />
              <input name="pickupDate" type="date" onChange={handleInputChange} required />
            </div>
            <button type="submit" className="btn-submit">Submit Load</button>
          </form>
        </section>
      )}

      <section className="dashboard-summary">
        <div className="summary-card profile-card">
          <h2>Profile Details</h2>
          <p><strong>Contact:</strong> {profile?.contactPerson}</p>
          <p><strong>Location:</strong> {profile?.location?.city}</p>
        </div>
        <div className="summary-card">
          <h2>Total Loads</h2>
          <p>{loads.length}</p>
        </div>
        <div className="summary-card">
          <h2>Active</h2>
          <p>{loads.filter(l => ['POSTED','MATCHED','ASSIGNED','IN_TRANSIT'].includes(l.status)).length}</p>
        </div>
        <div className="summary-card">
          <h2>Completed</h2>
          <p>{loads.filter(l => l.status === 'CLOSED').length}</p>
        </div>
      </section>

      <main className="dashboard-main">
        <div className="table-container">
          <h2>Your Posted Loads</h2>
          <table>
            <thead>
              <tr>
                <th>Cargo</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Assigned Trucker</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loads.map(load => (
                <tr key={load._id}>
                  <td>{load.cargoType}</td>
                  <td>{load.origin}</td>
                  <td>{load.destination}</td>
                  <td><span className={`status-badge ${load.status.toLowerCase()}`}>{load.status}</span></td>
                  <td>
                    {load.assignedTo ? (
                      <div>
                        <strong>{load.assignedTo.name}</strong>
                        <br />
                        <small>{load.assignedTo.email}</small>
                      </div>
                    ) : (
                      <span className="text-muted">Pending</span>
                    )}
                  </td>
                  <td>₹ {load.price}</td>
                  <td>
                      {load.status === 'MATCHED' && (
                          <button className="btn-sm btn-action" onClick={() => handleAssign(load._id, load.assignedTo._id)}>
                              Confirm Assignment
                          </button>
                      )}
                      {load.status === 'DELIVERED' && (
                          <button className="btn-sm btn-action" onClick={() => handleClose(load._id)}>
                              Close & Verify
                          </button>
                      )}
                      {(load.status === 'POSTED' || load.status === 'MATCHED') && (
                          <button className="btn-sm btn-danger" onClick={() => handleCancel(load._id)} style={{marginLeft: '5px', color: 'red', borderColor: 'red'}}>
                              Cancel
                          </button>
                      )}
                  </td>
                </tr>
              ))}
              {loads.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>No loads posted yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>&copy; 2025 SmartLogix. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default BusinessDashboard;
