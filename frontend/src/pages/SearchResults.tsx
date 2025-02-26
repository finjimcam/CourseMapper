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
