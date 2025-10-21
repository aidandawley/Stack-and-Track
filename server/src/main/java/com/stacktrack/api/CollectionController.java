package com.stacktrack.api;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.stacktrack.model.Collection;
import com.stacktrack.repo.CollectionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/collections")
@CrossOrigin(origins = "http://localhost:5173")

public class CollectionController {

    private final CollectionRepository repo;

    public CollectionController(CollectionRepository repo) {
        this.repo = repo;
    }

    // ---- helpers ----
    private String requireUid(String authHdr) {
        if (authHdr == null || !authHdr.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing token");
        }
        String idToken = authHdr.substring(7);
        try {
            FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(idToken);
            return decoded.getUid();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
        }
    }

    // ---- GET: list current user's collections ----
    @GetMapping
    public List<Collection> list(
            @RequestHeader(value = "Authorization", required = false) String authHdr) {
        String uid = requireUid(authHdr);
        return repo.findByUidOrderByCreatedAtDesc(uid);
    }

    // ---- POST: create a new collection for the current user ----
    public record CreateReq(String name) {
    }

    @PostMapping
    public Map<String, Object> create(
            @RequestHeader(value = "Authorization", required = false) String authHdr,
            @RequestBody CreateReq body) {
        String uid = requireUid(authHdr);
        if (body == null || body.name() == null || body.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }

        Collection c = new Collection();
        c.setUid(uid);
        c.setName(body.name().trim());
        c.setCreatedAt(Instant.now());
        Collection saved = repo.save(c);

        return Map.of(
                "id", saved.getId(),
                "name", saved.getName(),
                "uid", saved.getUid(),
                "createdAt", saved.getCreatedAt().toString());
    }
}
