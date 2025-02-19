import React, { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Spinner, Button } from 'flowbite-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function Layout() {
  const [loading, setLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    // Check session once on mount
    const checkSession = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_API}/session/`, {
          withCredentials: true
        });
        setSessionValid(true);
      } catch (err) {
        // session invalid
        setSessionValid(false);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner aria-label="Loading" size="xl" />
      </div>
    );
  }

  // If session is invalid, redirect to /login
  if (!sessionValid) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render your real layout
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 mt-[80px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
