import React, { useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { SignUpPage } from "./components/SignUpPage";
import { HomePage } from "./components/HomePage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<
    "login" | "signup" | "home"
  >("login");

  const handleLogin = () => {
    setCurrentPage("home");
  };

  const handleLogout = () => {
    setCurrentPage("login");
  };

  return (
    <>
      {currentPage === "login" && (
        <LoginPage
          onSwitchToSignUp={() => setCurrentPage("signup")}
          onLogin={handleLogin}
        />
      )}
      {currentPage === "signup" && (
        <SignUpPage
          onSwitchToLogin={() => setCurrentPage("login")}
          onSignUp={handleLogin}
        />
      )}
      {currentPage === "home" && (
        <HomePage onLogout={handleLogout} />
      )}
    </>
  );
}
