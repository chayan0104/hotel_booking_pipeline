package com.demo.service;

import com.demo.dto.BookingRequest;
import com.demo.model.Booking;
import com.demo.repository.BookingRepository;
import com.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    private final BookingRepository bookingRepository;

    public BookingService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public List<Booking> findAll() {
        List<Booking> list = bookingRepository.findAll();
        list.sort(Comparator.comparing(Booking::getId));
        return list;
    }

    public Booking findById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found for id: " + id));
    }

    public Booking create(BookingRequest request) {
        validateRequest(request);

        Booking booking = new Booking(
                request.getGuestName().trim(),
                normalizeEmail(request.getGuestEmail()),
                normalizeText(request.getPhone()),
                request.getRoomType().trim(),
                parseDate(request.getCheckInDate(), "checkInDate"),
                parseDate(request.getCheckOutDate(), "checkOutDate"),
                request.getGuests(),
                normalizeStatus(request.getStatus()),
                normalizeAmount(request.getTotalAmount()),
                normalizeText(request.getNotes())
        );

        return bookingRepository.save(booking);
    }

    public Booking update(Long id, BookingRequest request) {
        validateRequest(request);
        Booking existing = findById(id);

        existing.setGuestName(request.getGuestName().trim());
        existing.setGuestEmail(normalizeEmail(request.getGuestEmail()));
        existing.setPhone(normalizeText(request.getPhone()));
        existing.setRoomType(request.getRoomType().trim());
        existing.setCheckInDate(parseDate(request.getCheckInDate(), "checkInDate"));
        existing.setCheckOutDate(parseDate(request.getCheckOutDate(), "checkOutDate"));
        existing.setGuests(request.getGuests());
        existing.setStatus(normalizeStatus(request.getStatus()));
        existing.setTotalAmount(normalizeAmount(request.getTotalAmount()));
        existing.setNotes(normalizeText(request.getNotes()));

        return bookingRepository.save(existing);
    }

    public Booking updateStatus(Long id, String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("status is required");
        }

        Booking existing = findById(id);
        existing.setStatus(normalizeStatus(status));
        return bookingRepository.save(existing);
    }

    public void delete(Long id) {
        Booking existing = findById(id);
        bookingRepository.delete(existing);
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
}
