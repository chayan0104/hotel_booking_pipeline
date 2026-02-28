package com.demo.config;

import com.demo.model.Booking;
import com.demo.repository.BookingRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;

@Configuration
public class BookingDataInitializer {

    @Bean
    public CommandLineRunner seedBookings(BookingRepository bookingRepository) {
        return args -> {
            if (bookingRepository.count() > 0) {
                return;
            }

            bookingRepository.save(new Booking(
                    "Aarav Sharma",
                    "aarav@example.com",
                    "+91-9000000001",
                    "DELUXE",
                    LocalDate.of(2026, 3, 10),
                    LocalDate.of(2026, 3, 13),
                    2,
                    "CONFIRMED",
                    24000.0,
                    "Airport pickup requested"
            ));

            bookingRepository.save(new Booking(
                    "Mia Patel",
                    "mia@example.com",
                    "+91-9000000002",
                    "SUITE",
                    LocalDate.of(2026, 3, 12),
                    LocalDate.of(2026, 3, 15),
                    3,
                    "PENDING",
                    42000.0,
                    "Early check-in if available"
            ));

            bookingRepository.save(new Booking(
                    "Noah Kim",
                    "noah@example.com",
                    "+91-9000000003",
                    "STANDARD",
                    LocalDate.of(2026, 3, 18),
                    LocalDate.of(2026, 3, 20),
                    1,
                    "CONFIRMED",
                    12000.0,
                    ""
            ));
        };
    }
}
