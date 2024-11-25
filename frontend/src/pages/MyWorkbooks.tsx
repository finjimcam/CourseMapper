// MyWorkbooks.tsx

import { useEffect, useState } from 'react';
import axios from 'axios';
import SearchBar from '../components/Searchbar.tsx';
import Carousel from '../components/Carousel.tsx';
import { Link } from 'react-router-dom';

function MyWorkbooks() {
  const [workbooks, setWorkbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkbooks = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/workbooks/');
        setWorkbooks(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
    };

    fetchWorkbooks();
  }, []);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;

  const items = workbooks.map((workbook) => ({
    id: workbook.id,
    content: (
      <Link to={`/workbook/${workbook.id}`} key={workbook.id}>
        <div className="text-center">
          <img
            src="https://via.placeholder.com/150"
            alt="Workbook"
            className="rounded-lg shadow-md"
          />
          <p className="mt-2 text-sm text-gray-700">{workbook.title || 'Untitled Workbook'}</p>
        </div>
      </Link>
    ),
  }));

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
          <Carousel items={items} />
        </div>
      </div>
    </>
  );
}

export default MyWorkbooks;
