import React, { useState, useEffect } from "react";
import {
  useTheme,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const AttendanceModal = ({ isOpen, onClose, onSubmit, event }) => {
  const theme = useTheme();

  // Capture attendance state
  const [attendees, setAttendees] = useState([]);
  const [checked, setChecked] = useState({});
  const [people, setPeople] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(false);

  // Create person state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newPerson, setNewPerson] = useState({
    invitedBy: "",
    name: "",
    surname: "",
    gender: "",
    email: "",
    mobile: "",
    dob: "",
    address: "",
    leaders: ["", "", ""],
  });
  const [tabIndex, setTabIndex] = useState(0);

  // Filtered options for datalists
  const [invitedByPeople, setInvitedByPeople] = useState([]);
  const [leadersPeople, setLeadersPeople] = useState([]);

  const [alert, setAlert] = useState({ open: false, type: "success", message: "" });

  // Generic fetch function
  const fetchPeople = async (filter = "", setter = setPeople) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append("name", filter);
      params.append("perPage", "100");

      const res = await fetch(`http://localhost:8000/people?${params.toString()}`);
      const data = await res.json();

      if (data && data.people) {
        const formatted = data.people.map((p) => ({
          id: p._id,
          fullName: `${p.Name} ${p.Surname || ""}`.trim(),
        }));
        setter(formatted);
      }
    } catch (err) {
      console.error("Error fetching people:", err);
    } finally {
      setLoading(false);
    }
  };

  // Capture attendance fetch
  useEffect(() => {
    if (isOpen) fetchPeople();
  }, [isOpen]);

  // Debounced search for capture attendance
  useEffect(() => {
    if (isOpen) {
      const delay = setTimeout(() => fetchPeople(searchName), 200);
      return () => clearTimeout(delay);
    }
  }, [searchName, isOpen]);

  const handleAddAttendee = () => {
    if (searchName.trim() && !attendees.includes(searchName.trim())) {
      setAttendees([...attendees, searchName.trim()]);
      setSearchName("");
    }
  };

  const handleToggle = (name) => {
    setChecked({ ...checked, [name]: !checked[name] });
  };

  const handleSubmit = () => {
    const selected = Object.keys(checked).filter((name) => checked[name]);
    if (selected.length === 0) {
      setAlert({
        open: true,
        type: "error",
        message: `Please select attendees for "${event.eventName || event.service_name || "this event"}" before submitting.`,
      });
      return;
    }
    if (onSubmit) onSubmit(selected);
    setAlert({
      open: true,
      type: "success",
      message: `Attendance successfully submitted for "${event.eventName || event.service_name || "this event"}"!`,
    });
    onClose();
  };

  const handleCreatePerson = async () => {
    try {
      if (!newPerson.name || !newPerson.surname || !newPerson.email) {
        setAlert({ open: true, type: "error", message: "Please fill in required fields!" });
        return;
      }

      const res = await fetch("http://localhost:8000/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPerson),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create person");
      }

      setCreateModalOpen(false);
      setNewPerson({
        invitedBy: "",
        name: "",
        surname: "",
        gender: "",
        email: "",
        mobile: "",
        dob: "",
        address: "",
        leaders: ["", "", ""],
      });

      fetchPeople(); // Refresh capture attendance
      setAlert({ open: true, type: "success", message: "Person created successfully!" });
    } catch (err) {
      setAlert({ open: true, type: "error", message: err.message });
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "10px" },
    modal: { background: theme.palette.background.paper, color: theme.palette.text.primary, padding: "20px", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" },
    addContainer: { display: "flex", marginBottom: "16px", gap: "8px", flexWrap: "wrap", alignItems: "center" },
    input: { flex: 1, padding: "8px", borderRadius: "6px", border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.default, color: theme.palette.text.primary, outline: "none" },
    addBtn: { background: "#007bff", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer" },
    list: { maxHeight: "250px", overflowY: "auto", marginBottom: "16px", color: theme.palette.text.primary },
    listItem: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", color: theme.palette.text.primary, cursor: "pointer" },
    actions: { display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" },
    primaryBtn: { background: "#007bff", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", flex: 1 },
    secondaryBtn: { background: "#e84118", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", flex: 1 },
    iconBtn: { display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", color: "#007bff", marginBottom: "12px" },
    createModalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000, padding: "10px" },
    createModal: { background: theme.palette.background.paper, color: theme.palette.text.primary, padding: "20px", borderRadius: "12px", width: "100%", maxWidth: "850px", maxHeight: "95vh", overflowY: "auto", boxSizing: "border-box" }, // increased width and height
  };

  return (
    <>
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.iconBtn} onClick={() => setCreateModalOpen(true)}>
            <PersonAddIcon />
          </div>

          <h2>Capture Attendance - {event.eventName || event.service_name || "Event"}</h2>

          <div style={styles.addContainer}>
            <input type="text" placeholder="Search people..." value={searchName} onChange={(e) => setSearchName(e.target.value)} style={styles.input} />
            <button onClick={handleAddAttendee} style={styles.addBtn}>Add</button>
          </div>

          <div style={styles.list}>
            {attendees.map((name, index) => (
              <label key={index} style={styles.listItem}>
                <input type="checkbox" checked={!!checked[name]} onChange={() => handleToggle(name)} />
                {name}
              </label>
            ))}
            {loading ? <p>Loading...</p> : people.map((person) => (
              <label key={person.id} style={styles.listItem}>
                <input type="checkbox" checked={!!checked[person.fullName]} onChange={() => handleToggle(person.fullName)} />
                {person.fullName}
              </label>
            ))}
          </div>

          <div style={styles.actions}>
            <button style={styles.secondaryBtn} onClick={() => { if (onSubmit) onSubmit("did-not-meet"); onClose(); }}>Mark As Did Not Meet</button>
            <button onClick={handleSubmit} style={styles.primaryBtn}>Submit Attendance</button>
          </div>
        </div>
      </div>

      {/* Create Person Modal */}
      {createModalOpen && (
        <div style={styles.createModalOverlay}>
          <div style={styles.createModal}>
            <h2>Create New Person</h2>
            <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)}>
              <Tab label="NEW PERSON INFO" />
              <Tab label="LEADER INFO" />
            </Tabs>

            {tabIndex === 0 && (
              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px", minHeight: "450px", width: "100%" }}>
                <input
                  placeholder="Invited By *"
                  value={newPerson.invitedBy}
                  onChange={(e) => {
                    setNewPerson({ ...newPerson, invitedBy: e.target.value });
                    fetchPeople(e.target.value, setInvitedByPeople);
                  }}
                  style={{ ...styles.input, width: "80%" }}
                  list="invited-by-options"
                />
                <datalist id="invited-by-options">
                  {invitedByPeople.map((p) => <option key={p.id} value={p.fullName} />)}
                </datalist>

                <input placeholder="Name *" value={newPerson.name} onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })} style={{ ...styles.input, width: "80%" }} />
                <input placeholder="Surname *" value={newPerson.surname} onChange={(e) => setNewPerson({ ...newPerson, surname: e.target.value })} style={{ ...styles.input, width: "80%" }} />
                <div>
                  <label><input type="radio" name="gender" checked={newPerson.gender === "Male"} onChange={() => setNewPerson({ ...newPerson, gender: "Male" })} /> Male</label>
                  <label><input type="radio" name="gender" checked={newPerson.gender === "Female"} onChange={() => setNewPerson({ ...newPerson, gender: "Female" })} /> Female</label>
                </div>
                <input placeholder="Email Address *" value={newPerson.email} onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })} style={{ ...styles.input, width: "80%" }} />
                <input placeholder="Mobile Number *" value={newPerson.mobile} onChange={(e) => setNewPerson({ ...newPerson, mobile: e.target.value })} style={{ ...styles.input, width: "80%" }} />
                <input placeholder="Date Of Birth *" type="date" value={newPerson.dob} onChange={(e) => setNewPerson({ ...newPerson, dob: e.target.value })} style={{ ...styles.input, width: "80%" }} />
                <input placeholder="Home Address *" value={newPerson.address} onChange={(e) => setNewPerson({ ...newPerson, address: e.target.value })} style={{ ...styles.input, width: "80%" }} />
              </div>
            )}

            {tabIndex === 1 && (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {newPerson.leaders.map((l, i) => (
                  <div key={i}>
                    <input
                      placeholder={`Leader @${i + 1}`}
                      value={l}
                      onChange={(e) => {
                        const leaders = [...newPerson.leaders];
                        leaders[i] = e.target.value;
                        setNewPerson({ ...newPerson, leaders });
                        fetchPeople(e.target.value, setLeadersPeople);
                      }}
                      style={{ ...styles.input, width: "80%" }}
                      list={`leaders-options-${i}`}
                    />
                    <datalist id={`leaders-options-${i}`}>
                      {leadersPeople.map((p) => <option key={p.id} value={p.fullName} />)}
                    </datalist>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px", gap: "8px" }}>
              <button onClick={() => setCreateModalOpen(false)} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={handleCreatePerson} style={styles.primaryBtn}>Add Person</button>
            </div>
          </div>
        </div>
      )}

      <Snackbar open={alert.open} autoHideDuration={4000} onClose={() => setAlert({ ...alert, open: false })} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={alert.type} variant="filled" onClose={() => setAlert({ ...alert, open: false })}>{alert.message}</Alert>
      </Snackbar>
    </>
  );
};

export default AttendanceModal;
