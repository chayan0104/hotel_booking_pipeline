package com.demo.dto;

public class BookingStatusUpdateRequest {
    private String status;

    public BookingStatusUpdateRequest() {
    }

    public BookingStatusUpdateRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
