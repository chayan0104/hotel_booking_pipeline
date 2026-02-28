package com.demo.service;

import com.demo.dto.BookingRequest;
import com.demo.model.Booking;
import com.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class BookingService {
    private static final Set<String> ALLOWED_STATUSES = new HashSet<String>();

    static {
        ALLOWED_STATUSES.add("PENDING");
        ALLOWED_STATUSES.add("CONFIRMED");
        ALLOWED_STATUSES.add("CHECKED_IN");
        ALLOWED_STATUSES.add("CHECKED_OUT");
        ALLOWED_STATUSES.add("CANCELLED");
    }

    private final Map<Long, Booking> bookings = new ConcurrentHashMap<Long, Booking>();
    private final AtomicLong idGenerator = new AtomicLong(0);

    public BookingService() {
        seed();
    }

    public List<Booking> findAll() {
        List<Booking> list = new ArrayList<Booking>(bookings.values());
        list.sort(Comparator.comparing(Booking::getId));
        return list;
    }

    public Booking findById(Long id) {
        Booking booking = bookings.get(id);
        if (booking == null) {
            throw new ResourceNotFoundException("Booking not found for id: " + id);
        }
        return booking;
    }

    public Booking create(BookingRequest request) {
        validateRequest(request);

        Long id = idGenerator.incrementAndGet();
        String now = Instant.now().toString();
        Booking booking = new Booking(
                id,
                request.getGuestName().trim(),
                normalizeEmail(request.getGuestEmail()),
                normalizeText(request.getPhone()),
                request.getRoomType().trim(),
                normalizeDate(request.getCheckInDate()),
                normalizeDate(request.getCheckOutDate()),
                request.getGuests(),
                normalizeStatus(request.getStatus()),
                normalizeAmount(request.getTotalAmount()),
                normalizeText(request.getNotes()),
                now,
                now
        );

        bookings.put(id, booking);
        return booking;
    }

    public Booking update(Long id, BookingRequest request) {
        validateRequest(request);
        Booking existing = findById(id);

        existing.setGuestName(request.getGuestName().trim());
        existing.setGuestEmail(normalizeEmail(request.getGuestEmail()));
        existing.setPhone(normalizeText(request.getPhone()));
        existing.setRoomType(request.getRoomType().trim());
        existing.setCheckInDate(normalizeDate(request.getCheckInDate()));
        existing.setCheckOutDate(normalizeDate(request.getCheckOutDate()));
        existing.setGuests(request.getGuests());
        existing.setStatus(normalizeStatus(request.getStatus()));
        existing.setTotalAmount(normalizeAmount(request.getTotalAmount()));
        existing.setNotes(normalizeText(request.getNotes()));
        existing.setUpdatedAt(Instant.now().toString());

        return existing;
    }

    public Booking updateStatus(Long id, String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("status is required");
        }

        Booking existing = findById(id);
        existing.setStatus(normalizeStatus(status));
        existing.setUpdatedAt(Instant.now().toString());
        return existing;
    }

    public void delete(Long id) {
        Booking existing = findById(id);
        bookings.remove(existing.getId());
    }

    private void validateRequest(BookingRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request body is required");
        }
        if (isBlank(request.getGuestName())) {
            throw new IllegalArgumentException("guestName is required");
        }
        if (isBlank(request.getRoomType())) {
            throw new IllegalArgumentException("roomType is required");
        }
        if (request.getGuests() == null || request.getGuests() < 1) {
            throw new IllegalArgumentException("guests must be at least 1");
        }

        LocalDate checkIn = parseDate(request.getCheckInDate(), "checkInDate");
        LocalDate checkOut = parseDate(request.getCheckOutDate(), "checkOutDate");
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("checkOutDate must be after checkInDate");
        }

        if (!isBlank(request.getGuestEmail()) && !request.getGuestEmail().contains("@")) {
            throw new IllegalArgumentException("guestEmail must be a valid email address");
        }
        if (request.getTotalAmount() != null && request.getTotalAmount() < 0) {
            throw new IllegalArgumentException("totalAmount cannot be negative");
        }

        if (!isBlank(request.getStatus())) {
            normalizeStatus(request.getStatus());
        }
    }

    private String normalizeStatus(String status) {
        if (isBlank(status)) {
            return "CONFIRMED";
        }
        String normalized = status.trim().toUpperCase();
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("status must be one of PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED");
        }
        return normalized;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase();
    }

    private String normalizeDate(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    private Double normalizeAmount(Double amount) {
        if (amount == null) {
            return 0.0;
        }
        return amount;
    }

    private LocalDate parseDate(String value, String fieldName) {
        if (isBlank(value)) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(fieldName + " must be in YYYY-MM-DD format");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void seed() {
        create(new BookingRequest(
                "Aarav Sharma",
                "aarav@example.com",
                "+91-9000000001",
                "DELUXE",
                "2026-03-10",
                "2026-03-13",
                2,
                "CONFIRMED",
                24000.0,
                "Airport pickup requested"
        ));
        create(new BookingRequest(
                "Mia Patel",
                "mia@example.com",
                "+91-9000000002",
                "SUITE",
                "2026-03-12",
                "2026-03-15",
                3,
                "PENDING",
                42000.0,
                "Early check-in if available"
        ));
        create(new BookingRequest(
                "Noah Kim",
                "noah@example.com",
                "+91-9000000003",
                "STANDARD",
                "2026-03-18",
                "2026-03-20",
                1,
                "CONFIRMED",
                12000.0,
                ""
        ));
    }
}
