package com.demo.model;

public class ErrorResponse {
    private String error;
    private String message;
    private String path;
    private String timestamp;

    public ErrorResponse() {
    }

    public ErrorResponse(String error, String message, String path, String timestamp) {
        this.error = error;
        this.message = message;
        this.path = path;
        this.timestamp = timestamp;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
