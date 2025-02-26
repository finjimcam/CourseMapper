import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Grid from '../components/Grid';
import { getErrorMessage, Workbook } from '../utils/workbookUtils';
import SearchBar from '../components/Searchbar';

function SearchResults() {
  const [results, setResults] = useState<Workbook[] | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        console.log(searchParams);
        const response = await axios.get(`${import.meta.env.VITE_API}/search`, {
          params: searchParams,
        });
        console.log(response);
        setResults(response.data);
      } catch (err: unknown) {
        console.error(getErrorMessage(err));
      }
    };

    fetchResults();
  }, [searchParams]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Search Header */}
      <div className="mb-6 text-center">
        <h2 className="text-4xl font-bold text-gray-800">Search Results</h2>
        <p className="text-gray-500">Find the best workbooks for your learning needs.</p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center mb-6">
        <SearchBar />
      </div>

      {/* Results */}
      {results && results.length > 0 ? (
        <Grid workbooks={results} />
      ) : (
        <p className="text-center text-gray-500 text-lg mt-10">No search results found.</p>
      )}
    </div>
  );
}

export default SearchResults;
