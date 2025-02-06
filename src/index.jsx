import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App";
import AuthContextProvider from "./Context/AuthContext";
import ProvidersContextProvider from "./Context/ProvidersContext";

// Global CSS
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <ChakraProvider>
      <AuthContextProvider>
        <ProvidersContextProvider>
          <App />
        </ProvidersContextProvider>
      </AuthContextProvider>
    </ChakraProvider>
  </BrowserRouter>
); 