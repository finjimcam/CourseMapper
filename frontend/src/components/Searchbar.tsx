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

import { FormEvent, useState } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';

function SearchBar() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced search states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ledBy, setLedBy] = useState('');
  const [contributedBy, setContributedBy] = useState('');
  const [learningPlatform, setLearningPlatform] = useState('');

  function makeSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Create search params with all available filters
    const params: Record<string, string> = {};

    if (searchInput) params.name = searchInput;
    if (startDate) params.starts_after = startDate;
    if (endDate) params.ends_before = endDate;
    if (ledBy) params.led_by = ledBy;
    if (contributedBy) params.contributed_by = contributedBy;
    if (learningPlatform) params.learning_platform = learningPlatform;

    navigate({
      pathname: `/results`,
      search: createSearchParams(params).toString(),
    });
  }

  function clearAdvancedSearch() {
    setStartDate('');
    setEndDate('');
    setLedBy('');
    setContributedBy('');
    setLearningPlatform('');
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={(e) => makeSearch(e)} className="flex flex-col w-full gap-2">
        <div className="flex items-center w-full">
          <div className="relative w-full">
            <input
              type="text"
              id="simple-search"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="Search workbooks..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="p-2.5 ml-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 20 20">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
            <span className="sr-only">Search</span>
          </button>
          <button
            type="button"
            className="p-2.5 ml-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
            <span className="sr-only">Advanced Search</span>
          </button>
        </div>

        {/* Advanced search panel */}
        {showAdvanced && (
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm mt-2 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="starts-after"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Starts After
                </label>
                <input
                  type="date"
                  id="starts-after"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="ends-before"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Ends Before
                </label>
                <input
                  type="date"
                  id="ends-before"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="led-by" className="block mb-1 text-sm font-medium text-gray-700">
                  Led By
                </label>
                <input
                  type="text"
                  id="led-by"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Course lead name..."
                  value={ledBy}
                  onChange={(e) => setLedBy(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="contributed-by"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Contributed By
                </label>
                <input
                  type="text"
                  id="contributed-by"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Contributor name..."
                  value={contributedBy}
                  onChange={(e) => setContributedBy(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="learning-platform"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Learning Platform
                </label>
                <input
                  type="text"
                  id="learning-platform"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Platform name..."
                  value={learningPlatform}
                  onChange={(e) => setLearningPlatform(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearAdvancedSearch}
                  className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default SearchBar;
