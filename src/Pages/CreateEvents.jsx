import React, { useState } from "react";
import { Plus, X, User, Calendar, Clock, MapPin, FileText, DollarSign } from "lucide-react";

const CreateEvents = ({ onCancel, onEventCreated, userRole = "admin" }) => {
  const [eventTypes, setEventTypes] = useState([
    "Meeting",
    "Workshop", 
    "Conference",
    "Training",
    "Event Description"
  ]);
  
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newEventType, setNewEventType] = useState("");
  
  const [formData, setFormData] = useState({
    eventName: "",
    eventType: "",
    price: "",
    date: "",
    time: "",
    location: "",
    recurringDays: [],
    eventLeader: "",
    description: ""
  });

  // Check if user is admin
  if (userRole !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-red-500 mb-4">
            <User size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can create events.</p>
          <button 
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleDayChange = (day) => {
    const updatedDays = formData.recurringDays.includes(day)
      ? formData.recurringDays.filter(d => d !== day)
      : [...formData.recurringDays, day];
    
    setFormData({
      ...formData,
      recurringDays: updatedDays
    });
  };

  const addNewEventType = () => {
    if (newEventType.trim() && !eventTypes.includes(newEventType.trim())) {
      setEventTypes([...eventTypes, newEventType.trim()]);
      setFormData({ ...formData, eventType: newEventType.trim() });
      setNewEventType("");
      setShowNewTypeForm(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const eventPayload = {
        service_name: formData.eventName,
        eventType: formData.eventType,
        price: formData.price,
        date: `${formData.date}T${formData.time}`,
        location: formData.location,
        recurringDays: formData.recurringDays,
        eventLeader: formData.eventLeader,
        description: formData.description,
        attendees: [],
        total_attendance: 0
      };

      const response = await fetch("http://localhost:8000/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create event");
      }

      const data = await response.json();
      alert("Event successfully created!");

      if (onEventCreated) onEventCreated({ ...eventPayload, _id: data.id });
      if (onCancel) onCancel();
    } catch (err) {
      console.error(err);
      alert("Error creating event: " + err.message);
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Create New Event</h1>
            <button onClick={onCancel} className="text-white hover:text-gray-200">
              <X size={24} />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">Admin Access Only</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name
            </label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter event name"
              required
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <div className="flex gap-2">
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Event Type</option>
                {eventTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewTypeForm(true)}
                className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                title="Add new event type"
              >
                <Plus size={20} />
              </button>
            </div>
            
            {showNewTypeForm && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    placeholder="New event type name"
                    className="flex-1 p-2 border border-gray-300 rounded"
                  />
                  <button
                    type="button"
                    onClick={addNewEventType}
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewTypeForm(false); setNewEventType(""); }}
                    className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign size={16} className="inline mr-1" />
              Price (Optional)
            </label>
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., R80 or Free"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin size={16} className="inline mr-1" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Event location"
              required
            />
          </div>

          {/* Specific Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Specific Date (for one-time events)
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={16} className="inline mr-1" />
              Time
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Recurring Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recurring Days (for recurring events)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {days.map((day) => (
                <label key={day} className="flex items-center space-x-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={formData.recurringDays.includes(day)}
                    onChange={() => handleDayChange(day)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{day}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Event Leader */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User size={16} className="inline mr-1" />
              Event Leader
            </label>
            <input
              type="text"
              name="eventLeader"
              value={formData.eventLeader}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Event leader name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText size={16} className="inline mr-1" />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Event description..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvents;