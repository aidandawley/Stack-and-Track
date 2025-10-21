package com.stacktrack.collections;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CollectionsFsService {

    private final Firestore db;

    public CollectionsFsService(Firestore db) {
        this.db = db;
    }

    private CollectionReference colRefForUser(String uid) {
        return db.collection("users").document(uid).collection("collections");
    }

    public List<CollectionItem> list(String uid) throws Exception {
        ApiFuture<QuerySnapshot> fut = colRefForUser(uid).orderBy("createdAt", Query.Direction.DESCENDING).get();

        List<CollectionItem> out = new ArrayList<>();
        for (QueryDocumentSnapshot d : fut.get().getDocuments()) {
            String id = d.getId();
            String name = d.getString("name");
            Timestamp ts = d.getTimestamp("createdAt");
            Instant createdAt = ts != null ? ts.toDate().toInstant() : Instant.EPOCH;
            out.add(new CollectionItem(id, name, createdAt));
        }
        return out;
    }

    // ***** This is the method your controller is trying to call *****
    public CollectionItem create(String uid, String name) throws Exception {
        Map<String, Object> data = Map.of(
                "name", name,
                "createdAt", FieldValue.serverTimestamp());
        DocumentReference ref = colRefForUser(uid).document(); // auto-id
        ref.set(data).get(); // write
        DocumentSnapshot snap = ref.get().get(); // read back to resolve serverTimestamp

        Timestamp ts = snap.getTimestamp("createdAt");
        Instant createdAt = ts != null ? ts.toDate().toInstant() : Instant.now();
        return new CollectionItem(ref.getId(), name, createdAt);
    }

    public void delete(String uid, String id) throws Exception {
        colRefForUser(uid).document(id).delete().get();
    }
}
