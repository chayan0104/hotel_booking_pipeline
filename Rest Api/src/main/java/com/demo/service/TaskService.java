package com.demo.service;

import com.demo.dto.TaskRequest;
import com.exception.ResourceNotFoundException;
import com.demo.model.Task;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class TaskService {
    private final Map<Long, Task> tasks = new ConcurrentHashMap<Long, Task>();
    private final AtomicLong idGenerator = new AtomicLong(0);

    public TaskService() {
        seed();
    }

    public List<Task> findAll() {
        List<Task> list = new ArrayList<Task>(tasks.values());
        list.sort(Comparator.comparing(Task::getId));
        return list;
    }

    public Task findById(Long id) {
        Task task = tasks.get(id);
        if (task == null) {
            throw new ResourceNotFoundException("Task not found for id: " + id);
        }
        return task;
    }

    public Task create(TaskRequest request) {
        validateRequest(request);

        Long id = idGenerator.incrementAndGet();
        String now = Instant.now().toString();

        Task task = new Task(
                id,
                request.getTitle().trim(),
                normalizeText(request.getDescription()),
                normalizeStatus(request.getStatus()),
                now,
                now
        );

        tasks.put(id, task);
        return task;
    }

    public Task update(Long id, TaskRequest request) {
        validateRequest(request);

        Task existing = findById(id);
        existing.setTitle(request.getTitle().trim());
        existing.setDescription(normalizeText(request.getDescription()));
        existing.setStatus(normalizeStatus(request.getStatus()));
        existing.setUpdatedAt(Instant.now().toString());
        return existing;
    }

    public Task updateStatus(Long id, String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("status is required");
        }

        Task existing = findById(id);
        existing.setStatus(normalizeStatus(status));
        existing.setUpdatedAt(Instant.now().toString());
        return existing;
    }

    public void delete(Long id) {
        Task existing = findById(id);
        tasks.remove(existing.getId());
    }

    private void validateRequest(TaskRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request body is required");
        }
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("title is required");
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return "NEW";
        }
        return status.trim().toUpperCase();
    }

    private String normalizeText(String text) {
        if (text == null) {
            return "";
        }
        return text.trim();
    }

    private void seed() {
        create(new TaskRequest("Create Jenkins Pipeline", "Define CI stages for build and test", "IN_PROGRESS"));
        create(new TaskRequest("Add Security Scan", "Integrate dependency checks in pipeline", "NEW"));
        create(new TaskRequest("Deploy to Environment", "Prepare deployment step for demo stack", "NEW"));
    }
}
