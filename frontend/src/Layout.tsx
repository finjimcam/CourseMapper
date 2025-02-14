import React, { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Spinner, Button } from 'flowbite-react';

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

  // We can do logout the same way as before:
  const handleLogout = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API}/session/`, {
        withCredentials: true
      });
      setSessionValid(false);
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

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
      <nav className="bg-gray-800 text-white p-4 flex justify-between">
        <span className="font-bold">My Demo Site</span>
        <Button onClick={handleLogout} color="light">
          Logout
        </Button>
      </nav>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
