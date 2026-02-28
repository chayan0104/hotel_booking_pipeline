import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const ROOM_CATALOG = [
  { code: "STANDARD", name: "Standard Room", price: 6000, capacity: 2, perks: "WiFi, desk, breakfast" },
  { code: "DELUXE", name: "Deluxe Room", price: 9000, capacity: 3, perks: "Balcony, king bed, lounge access" },
  { code: "SUITE", name: "Executive Suite", price: 14000, capacity: 5, perks: "Living area, premium minibar, city view" },
];

const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"];
const ACTIVE_STATUSES = new Set(["PENDING", "CONFIRMED", "CHECKED_IN"]);

const DEFAULT_FORM = {
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

function parseApiError(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed.message || text;
  } catch (error) {
    return text || "Unexpected API error";
  }
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getNightCount(checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate) {
    return 0;
  }
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return 0;
  }
  const days = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

function getRoomByCode(code) {
  return ROOM_CATALOG.find((room) => room.code === code) || ROOM_CATALOG[0];
}

function getSuggestedAmount(roomType, checkInDate, checkOutDate) {
  const nights = getNightCount(checkInDate, checkOutDate);
  if (nights <= 0) {
    return "";
  }
  return getRoomByCode(roomType).price * nights;
}

function App() {
  const [bookings, setBookings] = useState([]);
  const [apiStatus, setApiStatus] = useState("loading");
  const [apiMessage, setApiMessage] = useState("Connecting to API...");
  const [lastSync, setLastSync] = useState("");
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadData = useCallback(async () => {
    setIsLoadingBookings(true);
    setFormError("");

    try {
      const [helloResponse, bookingsResponse] = await Promise.all([
        fetch("/hello"),
        fetch("/api/bookings"),
      ]);

      if (!helloResponse.ok || !bookingsResponse.ok) {
        throw new Error("Unable to fetch service data");
      }

      const [helloText, bookingsData] = await Promise.all([
        helloResponse.text(),
        bookingsResponse.json(),
      ]);

      setApiStatus("online");
      setApiMessage(helloText);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setLastSync(new Date().toISOString());
    } catch (error) {
      setApiStatus("offline");
      setApiMessage("API is not reachable. Check container logs.");
      setFormError(error.message || "Failed to load data");
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let active = 0;
    let checkInsToday = 0;
    let checkOutsToday = 0;
    let revenue = 0;
    let cancelled = 0;

    bookings.forEach((booking) => {
      if (ACTIVE_STATUSES.has(booking.status)) {
        active += 1;
      }
      if (booking.status === "CANCELLED") {
        cancelled += 1;
      } else {
        revenue += Number(booking.totalAmount || 0);
      }
      if (booking.checkInDate === today) {
        checkInsToday += 1;
      }
      if (booking.checkOutDate === today) {
        checkOutsToday += 1;
      }
    });

    return {
      total: bookings.length,
      active,
      checkInsToday,
      checkOutsToday,
      revenue,
      cancelled,
    };
  }, [bookings]);

  const visibleBookings = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return bookings
      .filter((booking) => {
        if (statusFilter !== "ALL" && booking.status !== statusFilter) {
          return false;
        }
        if (!query) {
          return true;
        }
        const searchable = [
          booking.id,
          booking.guestName,
          booking.guestEmail,
          booking.phone,
          booking.roomType,
          booking.status,
          booking.checkInDate,
          booking.checkOutDate,
        ].join(" ").toLowerCase();

        return searchable.includes(query);
      })
      .sort((a, b) => Number(a.id) - Number(b.id));
  }, [bookings, searchText, statusFilter]);

  const formNights = getNightCount(form.checkInDate, form.checkOutDate);
  const selectedRoom = getRoomByCode(form.roomType);

  function updateForm(field, value) {
    setForm((prev) => {
      const next = {
        ...prev,
        [field]: field === "guests" ? Number(value) : value,
      };

      if (field === "roomType" || field === "checkInDate" || field === "checkOutDate") {
        const suggested = getSuggestedAmount(next.roomType, next.checkInDate, next.checkOutDate);
        if (suggested) {
          next.totalAmount = suggested;
        }
      }
      return next;
    });
  }

  function validateForm() {
    if (!form.guestName.trim()) {
      return "Guest name is required";
    }
    if (form.guestEmail && !form.guestEmail.includes("@")) {
      return "Guest email format is invalid";
    }
    if (!form.checkInDate || !form.checkOutDate) {
      return "Check-in and check-out dates are required";
    }
    if (getNightCount(form.checkInDate, form.checkOutDate) <= 0) {
      return "Check-out must be after check-in";
    }
    if (!Number.isFinite(form.guests) || form.guests < 1) {
      return "At least 1 guest is required";
    }
    if (form.guests > selectedRoom.capacity) {
      return `Selected room supports up to ${selectedRoom.capacity} guests`;
    }
    if (form.totalAmount !== "" && Number(form.totalAmount) < 0) {
      return "Total amount cannot be negative";
    }
    return "";
  }

  async function createBooking(event) {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    const validation = validateForm();
    if (validation) {
      setFormError(validation);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guests: Number(form.guests),
          totalAmount: form.totalAmount === "" ? 0 : Number(form.totalAmount),
          status: "CONFIRMED",
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(parseApiError(text));
      }

      const created = await response.json();
      setBookings((prev) => [...prev, created].sort((a, b) => Number(a.id) - Number(b.id)));
      setForm(DEFAULT_FORM);
      setFormSuccess(`Booking #${created.id} created successfully`);
      setLastSync(new Date().toISOString());
    } catch (error) {
      setFormError(error.message || "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function changeBookingStatus(bookingId, nextStatus) {
    setFormError("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(parseApiError(text));
      }

      const updated = await response.json();
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? updated : booking)));
      setLastSync(new Date().toISOString());
    } catch (error) {
      setFormError(error.message || "Failed to update booking");
    }
  }

  async function cancelBooking(bookingId) {
    setFormError("");
    setFormSuccess("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(parseApiError(text));
      }
      setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
      setFormSuccess(`Booking #${bookingId} cancelled`);
      setLastSync(new Date().toISOString());
    } catch (error) {
      setFormError(error.message || "Failed to cancel booking");
    }
  }

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Hotel Operations Dashboard</p>
          <h1>Hotel Booking Service</h1>
          <p className="hero-copy">{apiMessage}</p>
        </div>
        <div className={`status-pill ${apiStatus}`}>
          <span className="dot" />
          API {apiStatus === "online" ? "Online" : apiStatus === "offline" ? "Offline" : "Checking"}
        </div>
      </header>

      <section className="panel metrics">
        <h2>Performance Snapshot</h2>
        <div className="metrics-grid">
          <article className="metric-card">
            <h3>Total Bookings</h3>
            <p>{metrics.total}</p>
          </article>
          <article className="metric-card">
            <h3>Active Stays</h3>
            <p>{metrics.active}</p>
          </article>
          <article className="metric-card">
            <h3>Check-ins Today</h3>
            <p>{metrics.checkInsToday}</p>
          </article>
          <article className="metric-card">
            <h3>Check-outs Today</h3>
            <p>{metrics.checkOutsToday}</p>
          </article>
          <article className="metric-card">
            <h3>Cancelled</h3>
            <p>{metrics.cancelled}</p>
          </article>
          <article className="metric-card revenue">
            <h3>Total Revenue</h3>
            <p>{formatMoney(metrics.revenue)}</p>
          </article>
        </div>
      </section>

      <section className="layout-grid">
        <article className="panel">
          <h2>Create Booking</h2>
          <p className="hint">Room: {selectedRoom.name} | Capacity: {selectedRoom.capacity} guests | Rate: {formatMoney(selectedRoom.price)} per night</p>

          <form className="booking-form" onSubmit={createBooking}>
            <input
              type="text"
              value={form.guestName}
              onChange={(event) => updateForm("guestName", event.target.value)}
              placeholder="Guest Name"
              required
            />
            <input
              type="email"
              value={form.guestEmail}
              onChange={(event) => updateForm("guestEmail", event.target.value)}
              placeholder="Guest Email"
            />
            <input
              type="text"
              value={form.phone}
              onChange={(event) => updateForm("phone", event.target.value)}
              placeholder="Phone Number"
            />
            <select value={form.roomType} onChange={(event) => updateForm("roomType", event.target.value)}>
              {ROOM_CATALOG.map((room) => (
                <option key={room.code} value={room.code}>
                  {room.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.checkInDate}
              onChange={(event) => updateForm("checkInDate", event.target.value)}
              required
            />
            <input
              type="date"
              value={form.checkOutDate}
              onChange={(event) => updateForm("checkOutDate", event.target.value)}
              required
            />
            <input
              type="number"
              min="1"
              max="10"
              value={form.guests}
              onChange={(event) => updateForm("guests", event.target.value)}
              required
            />
            <input
              type="number"
              min="0"
              value={form.totalAmount}
              onChange={(event) => updateForm("totalAmount", event.target.value)}
              placeholder="Total Amount"
            />
            <textarea
              rows="3"
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              placeholder="Special requests (optional)"
            />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create Booking"}
            </button>
          </form>

          <div className="booking-summary">
            <div>
              <strong>Estimated Nights:</strong> {formNights || 0}
            </div>
            <div>
              <strong>Estimated Total:</strong> {formNights > 0 ? formatMoney(getSuggestedAmount(form.roomType, form.checkInDate, form.checkOutDate)) : "-"}
            </div>
          </div>

          {formError ? <p className="alert error">{formError}</p> : null}
          {formSuccess ? <p className="alert success">{formSuccess}</p> : null}
        </article>

        <article className="panel">
          <h2>Room Plans</h2>
          <div className="room-list">
            {ROOM_CATALOG.map((room) => (
              <div key={room.code} className="room-card">
                <h3>{room.name}</h3>
                <p>{room.perks}</p>
                <p>Capacity: {room.capacity} guests</p>
                <strong>{formatMoney(room.price)} / night</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Booking Management</h2>
          <div className="actions">
            <button type="button" onClick={loadData}>Refresh</button>
          </div>
        </div>

        <div className="toolbar">
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by name, email, phone, room, booking ID"
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All Status</option>
            {BOOKING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <p className="hint">Showing {visibleBookings.length} of {bookings.length} bookings | Last sync: {formatDateTime(lastSync)}</p>

        {isLoadingBookings ? <p className="hint">Loading bookings...</p> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Guest</th>
                <th>Stay</th>
                <th>Room</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>#{booking.id}</td>
                  <td>
                    <strong>{booking.guestName}</strong>
                    <span>{booking.guestEmail || "-"}</span>
                    <span>{booking.phone || "-"}</span>
                  </td>
                  <td>
                    <span>{formatDate(booking.checkInDate)} -> {formatDate(booking.checkOutDate)}</span>
                    <span>{getNightCount(booking.checkInDate, booking.checkOutDate)} night(s)</span>
                  </td>
                  <td>{booking.roomType}</td>
                  <td>
                    <span className={`status-tag ${String(booking.status || "").toLowerCase()}`}>{booking.status}</span>
                  </td>
                  <td>{formatMoney(booking.totalAmount)}</td>
                  <td>{formatDateTime(booking.updatedAt)}</td>
                  <td>
                    <div className="row-actions">
                      <select
                        value={booking.status || "CONFIRMED"}
                        onChange={(event) => changeBookingStatus(booking.id, event.target.value)}
                      >
                        {BOOKING_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="danger" onClick={() => cancelBooking(booking.id)}>
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoadingBookings && visibleBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty">
                    No bookings found for selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default App;
