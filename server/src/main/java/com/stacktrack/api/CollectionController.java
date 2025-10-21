package com.stacktrack.api;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.stacktrack.collections.CollectionItem;
import com.stacktrack.collections.CollectionsFsService;
import com.stacktrack.users.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
public class CollectionController {

    private final CollectionsFsService svc;
    private final UserProfileService profiles; // NEW

    public CollectionController(CollectionsFsService svc,
            UserProfileService profiles) {
        this.svc = svc;
        this.profiles = profiles;
    }

    private FirebaseToken verify(String bearer) throws Exception {
        if (bearer == null || !bearer.startsWith("Bearer ")) {
            throw new RuntimeException("Missing bearer token");
        }
        String idToken = bearer.substring("Bearer ".length());
        return FirebaseAuth.getInstance().verifyIdToken(idToken);
    }

    @GetMapping
    public ResponseEntity<List<CollectionItem>> list(
            @RequestHeader("Authorization") String auth) throws Exception {
        FirebaseToken tok = verify(auth);
        profiles.ensureProfile(tok); // ensure users/{uid} has email/name
        String uid = tok.getUid();
        return ResponseEntity.ok(svc.list(uid));
    }

    @PostMapping
    public ResponseEntity<CollectionItem> create(
            @RequestHeader("Authorization") String auth,
            @RequestBody CreateReq body) throws Exception {
        FirebaseToken tok = verify(auth);
        profiles.ensureProfile(tok); // ensure users/{uid} has email/name
        String uid = tok.getUid();

        String name = (body != null) ? body.name() : "";
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(svc.create(uid, name.trim()));
    }

    // simple request DTO
    public record CreateReq(String name) {
    }
}
