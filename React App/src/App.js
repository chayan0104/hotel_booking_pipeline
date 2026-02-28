import React, { useCallback, useEffect, useState } from "react";
import "./App.css";

const roomCards = [
  { name: "Standard", beds: "1 Queen Bed", price: 6000 },
  { name: "Deluxe", beds: "1 King Bed", price: 9000 },
  { name: "Suite", beds: "2 Rooms + Living", price: 14000 },
];

const bookingStatuses = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"];

const removeTrailingSlash = (value) => value.replace(/\/+$/, "");

const resolveApiBaseUrl = () => {
  const envUrl =
    (typeof process !== "undefined" &&
      process.env &&
      process.env.REACT_APP_API_URL) ||
    "";
  if (envUrl && envUrl.trim()) {
    return removeTrailingSlash(envUrl.trim());
  }
  return "";
};

const initialForm = {
  guestName: "",
  guestEmail: "",
  phone: "",
  roomType: "STANDARD",
  checkInDate: "",
  checkOutDate: "",
  guests: 1,
  totalAmount: "",
  notes: "",
};

function App() {
  const apiBaseUrl = resolveApiBaseUrl();
  const [bookings, setBookings] = useState([]);
  const [apiMessage, setApiMessage] = useState("Loading service message...");
  const [status, setStatus] = useState("loading");
  const [updatedAt, setUpdatedAt] = useState("");
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBookings = useCallback(async () => {
    const [helloRes, bookingsRes] = await Promise.all([
      fetch(`${apiBaseUrl}/hello`),
      fetch(`${apiBaseUrl}/api/bookings`),
    ]);

    if (!helloRes.ok || !bookingsRes.ok) {
      throw new Error("Failed to fetch booking data");
    }

    const helloText = await helloRes.text();
    const bookingData = await bookingsRes.json();
    setApiMessage(helloText);
    setBookings(Array.isArray(bookingData) ? bookingData : []);
    setStatus("online");
    setUpdatedAt(new Date().toLocaleString());
  }, [apiBaseUrl]);

  useEffect(() => {
    let mounted = true;

    fetchBookings()
      .catch(() => {
        if (!mounted) {
          return;
        }
        setStatus("offline");
        setApiMessage("Unable to connect to hotel booking API.");
        setUpdatedAt(new Date().toLocaleString());
      });

    return () => {
      mounted = false;
    };
  }, [fetchBookings]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: name === "guests" ? Number(value) : value,
    }));
  };

  const handleCreateBooking = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        guests: Number(form.guests),
        totalAmount: form.totalAmount === "" ? 0 : Number(form.totalAmount),
        status: "CONFIRMED",
      };

      const response = await fetch(`${apiBaseUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create booking");
      }

      const createdBooking = await response.json();
      setBookings((previous) => [...previous, createdBooking].sort((a, b) => a.id - b.id));
      setForm(initialForm);
      setUpdatedAt(new Date().toLocaleString());
    } catch (error) {
      setFormError(error.message || "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (bookingId, nextStatus) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        throw new Error("Failed to update booking status");
      }
      const updated = await response.json();
      setBookings((previous) =>
        previous.map((item) => (item.id === bookingId ? updated : item))
      );
      setUpdatedAt(new Date().toLocaleString());
    } catch (error) {
      setFormError(error.message || "Failed to update status");
    }
  };

  const handleDelete = async (bookingId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/bookings/${bookingId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to cancel booking");
      }
      setBookings((previous) => previous.filter((item) => item.id !== bookingId));
      setUpdatedAt(new Date().toLocaleString());
    } catch (error) {
      setFormError(error.message || "Failed to cancel booking");
    }
  };

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">Hotel Management Console</p>
        <h1>Hotel Booking Service</h1>
        <p className="hero-copy">
          Manage room bookings, track guest status, and monitor API health from one dashboard.
        </p>
        <div className={`status-chip ${status}`}>
          <span className="dot" />
          API Status: {status === "online" ? "Connected" : status === "offline" ? "Disconnected" : "Checking..."}
        </div>
      </header>

      <section className="panel">
        <div className="panel-head">
          <h2>Room Categories</h2>
          <span>Last update: {updatedAt || "Waiting for response..."}</span>
        </div>
        <div className="room-grid">
          {roomCards.map((room) => (
            <article className="room-card" key={room.name}>
              <h3>{room.name}</h3>
              <p>{room.beds}</p>
              <strong>INR {room.price} / night</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Create Booking</h2>
        <p className="api-message">{apiMessage}</p>
        <form className="booking-form" onSubmit={handleCreateBooking}>
          <input
            name="guestName"
            placeholder="Guest Name"
            value={form.guestName}
            onChange={handleInputChange}
            required
          />
          <input
            name="guestEmail"
            placeholder="Guest Email"
            value={form.guestEmail}
            onChange={handleInputChange}
          />
          <input
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleInputChange}
          />
          <select name="roomType" value={form.roomType} onChange={handleInputChange}>
            <option value="STANDARD">Standard</option>
            <option value="DELUXE">Deluxe</option>
            <option value="SUITE">Suite</option>
          </select>
          <input
            name="checkInDate"
            type="date"
            value={form.checkInDate}
            onChange={handleInputChange}
            required
          />
          <input
            name="checkOutDate"
            type="date"
            value={form.checkOutDate}
            onChange={handleInputChange}
            required
          />
          <input
            name="guests"
            type="number"
            min="1"
            max="10"
            value={form.guests}
            onChange={handleInputChange}
            required
          />
          <input
            name="totalAmount"
            type="number"
            min="0"
            placeholder="Total Amount"
            value={form.totalAmount}
            onChange={handleInputChange}
          />
          <textarea
            name="notes"
            placeholder="Special requests (optional)"
            value={form.notes}
            onChange={handleInputChange}
            rows="3"
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Create Booking"}
          </button>
        </form>
        {formError ? <p className="form-error">{formError}</p> : null}
      </section>

      <section className="panel">
        <h2>Current Bookings ({bookings.length})</h2>
        <div className="booking-list">
          {bookings.map((booking) => (
            <article className="booking-card" key={booking.id}>
              <div className="booking-head">
                <h3>#{booking.id} - {booking.guestName}</h3>
                <span className={`pill ${String(booking.status || "").toLowerCase()}`}>
                  {booking.status}
                </span>
              </div>
              <p>
                <strong>Room:</strong> {booking.roomType} | <strong>Guests:</strong> {booking.guests}
              </p>
              <p>
                <strong>Stay:</strong> {booking.checkInDate} to {booking.checkOutDate}
              </p>
              <p>
                <strong>Email:</strong> {booking.guestEmail || "-"} | <strong>Phone:</strong> {booking.phone || "-"}
              </p>
              <p>
                <strong>Total:</strong> INR {booking.totalAmount}
              </p>
              {booking.notes ? <p><strong>Notes:</strong> {booking.notes}</p> : null}
              <div className="booking-actions">
                <select
                  value={booking.status || "CONFIRMED"}
                  onChange={(event) => handleStatusChange(booking.id, event.target.value)}
                >
                  {bookingStatuses.map((statusValue) => (
                    <option key={statusValue} value={statusValue}>
                      {statusValue}
                    </option>
                  ))}
                </select>
                <button type="button" className="danger" onClick={() => handleDelete(booking.id)}>
                  Cancel Booking
                </button>
              </div>
            </article>
          ))}
          {bookings.length === 0 ? <p>No bookings found.</p> : null}
        </div>
      </section>
    </main>
  );
}

export default App;
