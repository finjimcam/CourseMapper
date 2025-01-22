// MyWorkbooks.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchBar from '../components/Searchbar.tsx';
import Carousel from '../components/Carousel.tsx';
import { CreateWorkbookModal } from '../components/CreateWorkbookModal';
import { Link } from 'react-router-dom';

function MyWorkbooks() {
  const navigate = useNavigate();
  const [workbooks, setWorkbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchWorkbooks = async () => {
      try {
        // TODO: specify the user to get workbooks they are involved in 
        const response = await axios.get(`${import.meta.env.VITE_API}/workbooks/`);
        setWorkbooks(response.data);
        setLoading(false);
      } catch (err: any) {
        const error = err as Error;
        setError(error.message || 'An error occurred');
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
    // Store the workbook data in sessionStorage
    sessionStorage.setItem('newWorkbookData', JSON.stringify(workbookData));
    
    // Navigate to the edit page
    navigate('/workbooks/edit');
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="p-8 space-y-8">
        <h2 className="text-3xl font-bold text-left flex-grow">My Workbooks</h2>
        {/* row layout with SearchBar and Button */}
        <div className="flex items-center justify-between">
          <div className="w-1/3">
            <SearchBar />
          </div>

          <div className="w-1/3 text-right">
            <button
              type="button"
              className="text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 font-medium rounded-lg text-sm px-5 py-2.5"
              onClick={() => setShowCreateModal(true)}
            >
              Create Workbook
            </button>
          </div>
        </div>

        {/* Carousel Section */}
        <div className="space-y-4">
          <Carousel items={workbooks} />
        </div>
      </div>

      <CreateWorkbookModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateWorkbook}
      />
    </>
  );
}

export default MyWorkbooks;
