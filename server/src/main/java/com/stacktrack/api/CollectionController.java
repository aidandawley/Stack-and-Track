// src/main/java/com/stacktrack/api/CollectionController.java
package com.stacktrack.api;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.stacktrack.collections.CollectionItem;
import com.stacktrack.collections.CollectionsFsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
public class CollectionController {

    private final CollectionsFsService svc;

    public CollectionController(CollectionsFsService svc) {
        this.svc = svc;
    }

    // ------ helper to extract uid from the Authorization header ------
    private String requireUid(String bearer) throws Exception {
        if (bearer == null || !bearer.startsWith("Bearer "))
            throw new RuntimeException("Missing bearer token");
        String idToken = bearer.substring("Bearer ".length());
        FirebaseToken tok = FirebaseAuth.getInstance().verifyIdToken(idToken);
        return tok.getUid();
    }

    // ------ GET /api/collections ------
    @GetMapping
    public ResponseEntity<List<CollectionItem>> list(
            @RequestHeader("Authorization") String auth) throws Exception {
        String uid = requireUid(auth);
        return ResponseEntity.ok(svc.list(uid));
    }

    // ------ POST /api/collections ------
    public record CreateReq(String name) {
    }

    @PostMapping
    public ResponseEntity<CollectionItem> create(
            @RequestHeader("Authorization") String auth,
            @RequestBody CreateReq body) throws Exception {
        String uid = requireUid(auth);
        String name = body != null ? body.name() : "";
        if (name == null || name.isBlank())
            return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(svc.create(uid, name.trim()));
    }

    // ------ DELETE /api/collections/{id} ------
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader("Authorization") String auth,
            @PathVariable String id) throws Exception {
        String uid = requireUid(auth);
        svc.delete(uid, id);
        return ResponseEntity.noContent().build();
    }
}
