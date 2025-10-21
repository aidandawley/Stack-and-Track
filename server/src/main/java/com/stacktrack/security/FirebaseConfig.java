package com.stacktrack.security;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.google.cloud.firestore.Firestore;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class FirebaseConfig {

  @PostConstruct
  public void init() throws IOException {
    if (FirebaseApp.getApps().isEmpty()) {
      FirebaseOptions opts = FirebaseOptions.builder()
          .setCredentials(GoogleCredentials.getApplicationDefault()) // uses GOOGLE_APPLICATION_CREDENTIALS
          .build();
      FirebaseApp.initializeApp(opts);
    }
  }

  @Bean
  public Firestore firestore() {
    // This is what gets injected into CollectionsFsService
    return FirestoreClient.getFirestore();
  }
}
