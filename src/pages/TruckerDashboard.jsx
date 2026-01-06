import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { apiRequest } from '../services/api';
import './TruckerDashboard.css';

const TruckerDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [availableLoads, setAvailableLoads] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      // Fetch Profile
      const profileData = await apiRequest("/trucker/profile/me");
      setProfile(profileData);

      // Fetch Available Loads
      const loadsData = await apiRequest("/loads/available");
      setAvailableLoads(loadsData);

      // Fetch My Jobs (Active & Completed)
      const jobsData = await apiRequest("/loads/my-jobs");
      setMyJobs(jobsData);

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

  const handleAcceptLoad = async (loadId) => {
    try {
      await apiRequest(`/loads/${loadId}/accept`, { method: "PATCH" });
      toast.success("Interest registered! Waiting for business approval.");
      fetchData(); // Refresh the list
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePickupLoad = async (loadId) => {
    try {
      await apiRequest(`/loads/${loadId}/pickup`, { method: "PATCH" });
      toast.success("Load picked up! Drive safe.");
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeliverLoad = async (loadId) => {
    try {
      await apiRequest(`/loads/${loadId}/deliver`, { method: "PATCH" });
      toast.success("Load delivered! Waiting for verification.");
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Derived Data
  const activeJob = myJobs.find(job => ["MATCHED", "ASSIGNED", "IN_TRANSIT"].includes(job.status));
  const completedJobs = myJobs.filter(job => ["DELIVERED", "CLOSED"].includes(job.status));
  const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.price || 0), 0);

  if (loading) return <div className="dashboard-container">Loading...</div>;
  if (error) return <div className="dashboard-container">Error: {error}</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Trucker Dashboard</h1>
        <div className="dashboard-actions">
          <button className="btn-primary">Find New Loads</button>
          <button className="btn-secondary">My Schedule</button>
        </div>
      </header>

      <section className="dashboard-summary">
        <div className="summary-card profile-card">
          <h2>My Rig</h2>
          <p><strong>Vehicle:</strong> {profile?.vehicleType}</p>
          <p><strong>Capacity:</strong> {profile?.capacity} Tons</p>
          <p><strong>Base:</strong> {profile?.currentLocation?.city}</p>
        </div>
        
        {activeJob ? (
          <div className="summary-card active-job-card" style={{borderColor: '#28a745'}}>
            <h2>Current Job: {activeJob.status}</h2>
            <p><strong>To:</strong> {activeJob.destination}</p>
            <p><strong>Pay:</strong> ₹ {activeJob.price}</p>
            
            {activeJob.status === "ASSIGNED" && (
                <button className="btn-sm btn-success" onClick={() => handlePickupLoad(activeJob._id)} style={{marginTop: '10px', background: '#007bff', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}>
                  Confirm Pickup
                </button>
            )}

            {activeJob.status === "IN_TRANSIT" && (
                <button className="btn-sm btn-success" onClick={() => handleDeliverLoad(activeJob._id)} style={{marginTop: '10px', background: '#28a745', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}>
                  Confirm Delivery
                </button>
            )}

             {activeJob.status === "MATCHED" && (
                <small style={{display: 'block', marginTop: '10px', fontSize: '0.8rem', color: '#666'}}>Waiting for Business Approval...</small>
            )}
          </div>
        ) : (
           <div className="summary-card">
            <h2>Active Job</h2>
            <p>None</p>
          </div>
        )}

        <div className="summary-card">
          <h2>Completed Trips</h2>
          <p>{completedJobs.length}</p>
        </div>
        <div className="summary-card">
          <h2>Total Earnings</h2>
          <p>₹ {totalEarnings.toLocaleString()}</p>
        </div>
      </section>

      <main className="dashboard-main">
        <div className="table-container">
          <h2>Available Loads Near You</h2>
          <table>
            <thead>
              <tr>
                <th>Cargo</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Payout</th>
                <th>Weight</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {availableLoads.map(load => (
                <tr key={load._id}>
                  <td>{load.cargoType}</td>
                  <td>{load.origin}</td>
                  <td>{load.destination}</td>
                  <td>₹ {load.price}</td>
                  <td>{load.weight} Tons</td>
                  <td>
                    <button 
                      className="btn-sm" 
                      onClick={() => handleAcceptLoad(load._id)}
                    >
                      Request Load
                    </button>
                  </td>
                </tr>
              ))}
              {availableLoads.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>No available loads found.</td>
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

export default TruckerDashboard;
