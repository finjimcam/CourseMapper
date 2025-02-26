// Home.tsx

import { useEffect, useState } from 'react';
import axios from 'axios';
import SearchBar from '../components/Searchbar.tsx';
import Carousel from '../components/Carousel.tsx';
import { Link, useNavigate } from 'react-router-dom';
import { CreateWorkbookModal } from '../components/modals/CreateWorkbookModal.tsx';

function Home() {
  const navigate = useNavigate();
  const [workbooks, setWorkbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchWorkbooks = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API}/workbooks/`);
        setWorkbooks(response.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
    };

    fetchWorkbooks();
  }, []);

  const handleCreateWorkbook = (workbookData: {
    courseName: string;
    learningPlatformId: string;
    startDate: Date;
    endDate: Date;
    coordinatorIds: string[];
  }) => {
    sessionStorage.setItem('newWorkbookData', JSON.stringify(workbookData));
    navigate('/workbooks/edit');
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;

  return (
    <>
    <div className="p-8 space-y-8">
      <div className="flex flex-col items-centre space-y-4">
        <div className="space-y-2">
            <h2 className="text-3xl font-bold text-left">Welcome back, Tim!</h2>
            <h3 className="text-lg text-left text-gray-600">
              Explore and manage your courses with ease
            </h3>
        </div>

          <SearchBar />
          <div className="flex gap-4">
            <button
              type="button"
              className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
              onClick={() => navigate('/my-workbooks')}>
                My Workbooks
            </button>

            <button
              type="button"
              className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
              onClick={() => setShowCreateModal(true)}>
                Create Workbook
            </button>
        </div>

        <CreateWorkbookModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateWorkbook}
        />
        
        {/* <div className="flex flex-col justify-center items-center">
          <h1 className="text-2xl font-semibold text-left">Recent Workbooks</h1>
          <Carousel items={workbooks} />
        </div> */}
      </div>
    </div>
    <div className="flex flex-col justify-center items-center">
          <h1 className="text-2xl font-semibold text-left">Recent Workbooks</h1>
          <Carousel items={workbooks} />
        </div>
    </>
  );
}

export default Home;
