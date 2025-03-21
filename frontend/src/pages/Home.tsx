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

// Home.tsx

import { useEffect, useState } from 'react';
import axios from 'axios';
import SearchBar from '../components/Searchbar.tsx';
import Carousel from '../components/Carousel.tsx';
import Grid from '../components/Grid.tsx';
import { useNavigate } from 'react-router-dom';
import { CreateWorkbookModal } from '../components/modals/CreateWorkbookModal.tsx';
import { getErrorMessage, Workbook } from '../utils/workbookUtils.tsx';

function Home() {
  const navigate = useNavigate();
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [username, setUsername] = useState('');
  const [showAllWorkbooks, setShowAllWorkbooks] = useState(false);

  useEffect(() => {
    // Fetch user data when component mounts
    axios
      .get(`${process.env.VITE_API}/session/`, {
        withCredentials: true,
      })
      .then((sessionResponse) => {
        // Get user details using the user_id from session
        return axios.get(`${process.env.VITE_API}/users/`).then((usersResponse) => ({
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
  }, []);

  useEffect(() => {
    const fetchWorkbooks = async () => {
      try {
        // Get all workbooks with full details
        const response = await axios.get(`${process.env.VITE_API}/workbooks/search/`, {
          params: {}, // Empty params to get all workbooks
        });
        setWorkbooks(response.data);
        setLoading(false);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    };

    fetchWorkbooks();
  }, []);

  const handleCreateWorkbook = (workbookData: {
    courseName: string;
    learningPlatformId: string;
    startDate: string;
    endDate: string;
    coordinatorIds: string[];
    areaId: string;
    schoolId: string | null;
    learningPlatform: string;
  }) => {
    sessionStorage.setItem('newWorkbookData', JSON.stringify(workbookData));
    navigate('/workbooks/create');
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="flex px-16 justify-center">
        <div className="p-8 space-y-8 flex-1 max-w-2xl">
          <div className="flex flex-col items-centre space-y-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-left">Welcome back, {username}!</h2>
              <h3 className="text-lg text-left text-gray-600">
                Explore and manage your courses with ease
              </h3>
            </div>

            <SearchBar />
            <div className="flex gap-4">
              <button
                type="button"
                className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 transition delay-150 duration-150 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500"
                onClick={() => navigate('/my-workbooks')}
              >
                My Workbooks
              </button>

              <button
                type="button"
                className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 transition delay-150 duration-150 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500"
                onClick={() => setShowCreateModal(true)}
              >
                Create Workbook
              </button>
            </div>

            <CreateWorkbookModal
              show={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSubmit={handleCreateWorkbook}
            />
          </div>
        </div>
        <div className="flex flex-col justify-center items-center w-1/2 min-w-[400px]">
          <h1 className="text-2xl font-semibold text-left">Recent Workbooks</h1>
          <Carousel
            items={workbooks.map((wb, index) => ({
              id: index + 1, // Use index + 1 for display purposes only
              workbookId: wb.workbook.id, // Use actual workbook ID for navigation
              course_name: wb.workbook.course_name,
              start_date: wb.workbook.start_date,
              end_date: wb.workbook.end_date,
              course_lead_id: wb.course_lead.id,
              learning_platform_id: wb.learning_platform.id,
              course_lead: wb.course_lead.name,
              learning_platform: wb.learning_platform.name,
              area_id: wb.workbook.area_id,
              school_id: wb.workbook.school_id,
            }))}
          />
        </div>
      </div>
      <div className="px-16 py-8">
        <h1 className="text-2xl font-semibold mb-4">All Workbooks</h1>
        <div className="flex flex-col items-center justify-center">
          <Grid workbooks={showAllWorkbooks ? workbooks : workbooks.slice(0, 16)} />
          {workbooks.length > 16 && (
            <button
              onClick={() => setShowAllWorkbooks(!showAllWorkbooks)}
              className="mt-4 text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition delay-150 duration-150 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500"
            >
              {showAllWorkbooks ? 'Show Less' : 'Show All'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default Home;
