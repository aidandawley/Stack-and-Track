package com.stacktrack.users;

import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.cloud.FirestoreClient;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.SetOptions;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Firestore;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserProfileService {

    private Firestore db() {

        return FirestoreClient.getFirestore();
    }

    public void ensureProfile(FirebaseToken tok) throws Exception {
        String uid = tok.getUid();

        Map<String, Object> data = new HashMap<>();
        if (tok.getEmail() != null)
            data.put("email", tok.getEmail());
        if (tok.getName() != null)
            data.put("name", tok.getName());
        data.put("updatedAt", Timestamp.now());

        DocumentReference ref = db().collection("users").document(uid);

        ref.set(data, SetOptions.merge()).get();
    }
}
