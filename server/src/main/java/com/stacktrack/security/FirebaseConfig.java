package com.stacktrack.security;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
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
}
