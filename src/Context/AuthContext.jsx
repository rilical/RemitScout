import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

const isLoggedInitially = JSON.parse(localStorage.getItem("IsLogged")) || false;

function AuthContextProvider({ children }) {
  const [isAuth, setIsAuth] = useState(isLoggedInitially);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (isAuth && !currentUser) {
      // If user is authenticated but we haven't loaded from localStorage:
      const savedUser = JSON.parse(localStorage.getItem("loginUser"));
      if (savedUser) {
        setCurrentUser(savedUser);
      }
    }
  }, [isAuth, currentUser]);

  const signIn = (email, password) => {
    const allUsers = JSON.parse(localStorage.getItem("RemitScoutUsers") || "[]");
    const user = allUsers.find((u) => u.email === email && u.password === password);
    if (user) {
      setIsAuth(true);
      setCurrentUser(user);
      localStorage.setItem("IsLogged", JSON.stringify(true));
      localStorage.setItem("loginUser", JSON.stringify(user));
      return true;
    }
    return false;
  };

  const signUp = (newUser) => {
    const allUsers = JSON.parse(localStorage.getItem("RemitScoutUsers") || "[]");
    allUsers.push(newUser);
    localStorage.setItem("RemitScoutUsers", JSON.stringify(allUsers));
  };

  const signOut = () => {
    setIsAuth(false);
    setCurrentUser(null);
    localStorage.setItem("IsLogged", JSON.stringify(false));
    localStorage.removeItem("loginUser");
  };

  const value = {
    isAuth,
    currentUser,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;
