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

    public CollectionCardItem addItem(String uid, String collectionId, CollectionCardItem item) throws Exception {
        CollectionReference itemsRef = colRefForUser(uid)
                .document(collectionId)
                .collection("items");

        // map to Firestore fields
        var data = new java.util.HashMap<String, Object>();
        data.put("cardId", item.getCardId());
        data.put("name", item.getName());
        data.put("setName", item.getSetName());
        data.put("imageSmall", item.getImageSmall());
        data.put("priceUSD", item.getPriceUSD());
        data.put("priceUpdatedAt", item.getPriceUpdatedAt());
        data.put("addedAt", FieldValue.serverTimestamp());

        DocumentReference ref = itemsRef.document(); // auto id
        ref.set(data).get();

        // read back to resolve serverTimestamp
        DocumentSnapshot snap = ref.get().get();
        com.google.cloud.Timestamp ts = snap.getTimestamp("addedAt");
        java.time.Instant addedAt = ts != null ? ts.toDate().toInstant() : java.time.Instant.now();

        return new CollectionCardItem(
                ref.getId(),
                item.getCardId(),
                item.getName(),
                item.getSetName(),
                item.getImageSmall(),
                item.getPriceUSD(),
                item.getPriceUpdatedAt(),
                addedAt);
    }

    public List<CollectionCardItem> listItems(String uid, String collectionId) throws Exception {
        CollectionReference itemsRef = colRefForUser(uid).document(collectionId).collection("items");
        ApiFuture<QuerySnapshot> fut = itemsRef.orderBy("addedAt", Query.Direction.DESCENDING).get();

        List<CollectionCardItem> out = new ArrayList<>();
        for (QueryDocumentSnapshot d : fut.get().getDocuments()) {
            String id = d.getId();
            String cardId = d.getString("cardId");
            String name = d.getString("name");
            String setName = d.getString("setName");
            String imageSmall = d.getString("imageSmall");
            Double priceUSD = d.contains("priceUSD") ? d.getDouble("priceUSD") : null;
            String priceUpdatedAt = d.getString("priceUpdatedAt");
            Timestamp ts = d.getTimestamp("addedAt");
            Instant addedAt = ts != null ? ts.toDate().toInstant() : Instant.EPOCH;

            out.add(new CollectionCardItem(id, cardId, name, setName, imageSmall, priceUSD, priceUpdatedAt, addedAt));
        }
        return out;
    }

    public void deleteItem(String uid, String collectionId, String itemId) throws Exception {
        colRefForUser(uid).document(collectionId).collection("items").document(itemId).delete().get();
    }

}
