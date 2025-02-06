import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import Home from "./Components/Home";
import ProviderList from "./Components/ProviderList";
import ProviderDetail from "./Components/ProviderDetail";
import Payment from "./Components/Payment";
import Favorites from "./Components/Favorites";
import SignIn from "./Components/SignIn";
import SignUp from "./Components/SignUp";
import NotFound from "./Components/NotFound";
import PrivateRoute from "./Components/PrivateRoute";
import Profile from "./Components/Profile";
import Transactions from "./Components/Transactions";
import ContactUs from "./Components/ContactUs";
import PrivacyPolicy from "./Components/PrivacyPolicy";

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<Home />} />

          {/* Show all or filtered providers */}
          <Route path="/providers" element={<ProviderList />} />

          {/* Single provider details */}
          <Route path="/provider/:id" element={<ProviderDetail />} />

          {/* Payment checkout (protected) */}
          <Route
            path="/payment/:id"
            element={
              <PrivateRoute>
                <Payment />
              </PrivateRoute>
            }
          />

          {/* User favorites (protected) */}
          <Route
            path="/favorites"
            element={
              <PrivateRoute>
                <Favorites />
              </PrivateRoute>
            }
          />

          {/* Past transactions (protected) */}
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <Transactions />
              </PrivateRoute>
            }
          />

          {/* Simple user profile page (protected) */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* Auth */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Contact Us */}
          <Route path="/contact" element={<ContactUs />} />

          {/* Privacy Policy */}
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
