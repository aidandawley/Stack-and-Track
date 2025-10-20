/// <reference types="vite/client" />

// (Optional but nice) declare your specific env keys for IntelliSense
interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
  
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_APP_ID: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  