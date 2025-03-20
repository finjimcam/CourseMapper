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
import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, Dropdown } from 'flowbite-react';
import axios from 'axios';
import { canUserEdit } from '../utils/workbookUtils';

interface WorkbookData {
  id: string;
  course_name: string;
}

function Navbar() {
  const location = useLocation();
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  const [username, setUsername] = useState('');
  const [canEdit, setCanEdit] = useState<boolean>(false);

  useEffect(() => {
    if (location.pathname.startsWith('/workbook/')) {
      const workbookId = location.pathname.split('/')[2];
      axios
      .get(`${import.meta.env.VITE_API}/workbooks/${workbookId}/details`)
      .then(async (response) => {
        setWorkbookData(response.data.workbook);
        const userCanEdit = await canUserEdit(workbookId);
        setCanEdit(userCanEdit);
      })
      .catch((error) => {
        console.error('Error fetching workbook data:', error);
      });
    }
  }, [location.pathname]);

  useEffect(() => {
    // Fetch user data when component mounts
    axios
      .get(`${import.meta.env.VITE_API}/session/`, {
        withCredentials: true,
      })
      .then((sessionResponse) => {
        // Get user details using the user_id from session
        return axios.get(`${import.meta.env.VITE_API}/users/`).then((usersResponse) => ({
          sessionData: sessionResponse.data,
          users: usersResponse.data,
        }));
      })
      .then(({ sessionData, users }) => {
        const currentUser = users.find((user: { id: string }) => user.id === sessionData.user_id);
        if (currentUser) {
          setUsername(currentUser.name);
        }
      })
      .catch((error) => {
        console.error('Error fetching user data:', error);
        setUsername(''); // Reset username on error
      });
  }, [location.pathname]); // Add location.pathname to dependency array to re-run on navigation

  const handleLogout = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API}/session/`, {
        withCredentials: true,
      });
      setUsername(''); // Reset username state on logout
      window.location.href = '/login'; // Redirect to login page instead
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
      <div className="w-full flex flex-wrap items-center justify-between p-4">
        <NavLink to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <img
            src="/LISU.png"
            className="w-[32px] sm:w-[64px] md:w-[96px] lg:w-[128px] xl:w-[256px]"
            alt="LISU Logo"
          />
        </NavLink>
        <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <Dropdown
            arrowIcon={false}
            inline
            label={<img className="w-8 h-8 rounded-full" src="/user.png" alt="user photo" />}
          >
            <Dropdown.Header>
              <span className="block text-sm text-gray-900">{username || 'User'}</span>
            </Dropdown.Header>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout}>Sign out</Dropdown.Item>
          </Dropdown>
        </div>
        {/* Center Section - Breadcrumb */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          {(location.pathname.startsWith('/workbook/') ||
            location.pathname === '/my-workbooks') && (
            <Breadcrumb aria-label="Breadcrumb" className="bg-transparent">
              <Breadcrumb.Item href="/" className="text-gray-900 hover:text-blue-700">
                Home
              </Breadcrumb.Item>
              {location.pathname === '/my-workbooks' ? (
                <Breadcrumb.Item className="text-gray-700">My Workbooks</Breadcrumb.Item>
              ) : (
                <>
                  {canEdit && (
                    <Breadcrumb.Item
                      href="/my-workbooks"
                      className="text-gray-900 hover:text-blue-700"
                    >
                      My Workbooks
                    </Breadcrumb.Item>
                  )}
                  <Breadcrumb.Item className="text-gray-700">
                    {workbookData?.course_name || 'Workbook'}
                  </Breadcrumb.Item>
                </>
              )}
            </Breadcrumb>
          )}
        </div>
        <div
          className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
          id="navbar-user"
        >
          <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white">
            {/* Other nav items can go here */}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
