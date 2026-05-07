import { createContext, useState, useCallback } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("user_logged_name") || "";
  });

  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem("user_logged_email") || "";
  });

  const [isHighContrast, setIsHighContrast] = useState(() => {
    return localStorage.getItem("high_contrast") === "true";
  });

  const login = (name, email) => {
    setUserName(name);
    setUserEmail(email);
    localStorage.setItem("user_logged_name", name);
    localStorage.setItem("user_logged_email", email);
  };

  const logout = () => {
    setUserName("");
    setUserEmail("");
    localStorage.removeItem("user_logged_name");
    localStorage.removeItem("user_logged_email");
  };

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast((prev) => {
      const next = !prev;
      localStorage.setItem("high_contrast", next);
      return next;
    });
  }, []);

  return (
    <UserContext.Provider
      value={{
        userName,
        userEmail,
        isHighContrast,
        login,
        logout,
        toggleHighContrast,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
