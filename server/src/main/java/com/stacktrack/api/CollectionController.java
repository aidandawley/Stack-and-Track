// src/main/java/com/stacktrack/api/CollectionController.java
package com.stacktrack.api;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.stacktrack.collections.CollectionItem;
import com.stacktrack.collections.CollectionCardItem;
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

    // ====== ITEMS ======

    // Request payload for adding an item (tiny snapshot as discussed)
    public record AddItemReq(
            String id, // required: PokemonTCG.io card id (e.g., "sv1-1")
            String name,
            String setName,
            String imageSmall,
            Double priceUSD,
            String priceUpdatedAt) {
    }

    // ------ POST /api/collections/{collectionId}/items ------
    @PostMapping("/{collectionId}/items")
    public ResponseEntity<CollectionCardItem> addItem(
            @RequestHeader("Authorization") String auth,
            @PathVariable String collectionId,
            @RequestBody AddItemReq body) {
        try {
            String uid = requireUid(auth);
            if (body == null || body.id == null || body.id.isBlank()) {
                return ResponseEntity.badRequest().build();
            }

            var toSave = new CollectionCardItem(
                    null,
                    body.id().trim(),
                    safe(body.name()),
                    safe(body.setName()),
                    safe(body.imageSmall()),
                    body.priceUSD(),
                    safe(body.priceUpdatedAt()),
                    null // addedAt set by serverTimestamp
            );

            var saved = svc.addItem(uid, collectionId, toSave);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            // You can log e.printStackTrace() here if you want diagnostics
            return ResponseEntity.status(500).build();
        }
    }

    private static String safe(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    // GET /api/collections/{collectionId}/items
    @GetMapping("/{collectionId}/items")
    public ResponseEntity<List<CollectionCardItem>> listItems(
            @RequestHeader("Authorization") String auth,
            @PathVariable String collectionId) throws Exception {
        String uid = requireUid(auth);
        return ResponseEntity.ok(svc.listItems(uid, collectionId));
    }

    // DELETE /api/collections/{collectionId}/items/{itemId}
    @DeleteMapping("/{collectionId}/items/{itemId}")
    public ResponseEntity<Void> deleteItem(
            @RequestHeader("Authorization") String auth,
            @PathVariable String collectionId,
            @PathVariable String itemId) throws Exception {
        String uid = requireUid(auth);
        svc.deleteItem(uid, collectionId, itemId);
        return ResponseEntity.noContent().build();
    }

}
