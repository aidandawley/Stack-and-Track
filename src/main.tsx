import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider";   
import ProtectedRoute from "./auth/ProtectedRoute";   
import Login from "./pages/Login";
import Home from "./pages/Home";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/", element: <ProtectedRoute><Home /></ProtectedRoute> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
