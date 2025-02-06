import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Components/Home';
import ProviderList from './Components/ProviderList';
import Navbar from './Components/Navbar';
import ContactUs from './Components/ContactUs';
import NotFound from './Components/NotFound';
import PrivacyPolicy from './Components/PrivacyPolicy';
import { ProvidersProvider } from './Context/ProvidersContext';
import Footer from './Components/Footer';

function App() {
  return (
    <ChakraProvider>
      <ProvidersProvider>
        <Router>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/providers" element={<ProviderList />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </Router>
      </ProvidersProvider>
    </ChakraProvider>
  );
}

export default App; 