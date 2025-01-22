// MyWorkbooks.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import SearchBar from '../components/Searchbar.tsx';
import Carousel from '../components/Carousel.tsx';

function MyWorkbooks() {
  const [workbooks, setWorkbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkbooks = async () => {
      try {
        // TODO: specify the user to get workbooks they are involved in 
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
    </>
  );
}

export default MyWorkbooks;
