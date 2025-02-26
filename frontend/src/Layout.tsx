/*
Source code for LISU CCM @UofG
Copyright (C) 2025 Maxine Armstrong, Ibrahim Asghar, Finlay Cameron, Colin Nardo, Rachel Horton, Qikai Zhou

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program at /LICENSE.md. If not, see <https://www.gnu.org/licenses/>.
*/

import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Spinner } from 'flowbite-react';
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
          withCredentials: true,
        });
        setSessionValid(true);
      } catch (err) {
        console.log(err);
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
