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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API}/workbooks/search/`, {
          params: searchParams,
        });
        setResults(response.data);
      } catch (err: unknown) {
        console.error(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  // Build a description of the current search
  const buildSearchDescription = () => {
    const params = Object.fromEntries(searchParams.entries());
    const descriptions: string[] = [];

    if (params.name) descriptions.push(`name contains "${params.name}"`);
    if (params.starts_after)
      descriptions.push(`starts after ${new Date(params.starts_after).toLocaleDateString()}`);
    if (params.ends_before)
      descriptions.push(`ends before ${new Date(params.ends_before).toLocaleDateString()}`);
    if (params.led_by) descriptions.push(`led by "${params.led_by}"`);
    if (params.contributed_by) descriptions.push(`contributed to by "${params.contributed_by}"`);
    if (params.learning_platform) descriptions.push(`on platform "${params.learning_platform}"`);
    if (params.area) descriptions.push(`in area "${params.area}"`);
    if (params.school) descriptions.push(`at school "${params.school}"`);

    return descriptions.length
      ? `Showing workbooks where ${descriptions.join(', ')}`
      : 'Showing all workbooks';
  };

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

      {/* Search description */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">{buildSearchDescription()}</p>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center mt-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : results && results.length > 0 ? (
        <Grid workbooks={results} />
      ) : (
        <p className="text-center text-gray-500 text-lg mt-10">No search results found.</p>
      )}
    </div>
  );
}

export default SearchResults;
