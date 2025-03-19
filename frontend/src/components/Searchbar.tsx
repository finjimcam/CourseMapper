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

import { FormEvent, useState, useEffect, useRef } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface School {
  id: string;
  name: string;
}

interface Area {
  id: string;
  name: string;
}

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
  const [area, setArea] = useState('');
  const [areaId, setAreaId] = useState('');
  const [school, setSchool] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const schoolRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schoolsResponse, areasResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API}/schools/`),
          axios.get(`${import.meta.env.VITE_API}/area/`)
        ]);
        setSchools(schoolsResponse.data);
        setAreas(areasResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (schoolRef.current && !schoolRef.current.contains(event.target as Node)) {
        setShowSchoolDropdown(false);
      }
      if (areaRef.current && !areaRef.current.contains(event.target as Node)) {
        setShowAreaDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSchoolInput = (value: string) => {
    setSchool(value);
    setSchoolId(''); // Clear the ID when typing
    const filtered = schools.filter(s => 
      s.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSchools(filtered);
    setShowSchoolDropdown(true);
  };

  const handleAreaInput = (value: string) => {
    setArea(value);
    setAreaId(''); // Clear the ID when typing
    const filtered = areas.filter(a => 
      a.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredAreas(filtered);
    setShowAreaDropdown(true);
  };

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
    if (areaId) params.area_id = areaId;
    if (schoolId) params.school_id = schoolId;

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
    setArea('');
    setAreaId('');
    setSchool('');
    setSchoolId('');
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

              <div ref={areaRef} className="relative">
                <label
                  htmlFor="area"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Area {isLoading && <span className="text-gray-400 text-xs ml-1">(Loading...)</span>}
                </label>
                <input
                  disabled={isLoading}
                  type="text"
                  id="area"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Area name..."
                  value={area}
                  onChange={(e) => handleAreaInput(e.target.value)}
                  onFocus={() => setShowAreaDropdown(true)}
                />
                {showAreaDropdown && filteredAreas.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredAreas.map((a) => (
                      <div
                        key={a.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setArea(a.name);
                          setAreaId(a.id);
                          setShowAreaDropdown(false);
                        }}
                      >
                        {a.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div ref={schoolRef} className="relative">
                <label
                  htmlFor="school"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  School {isLoading && <span className="text-gray-400 text-xs ml-1">(Loading...)</span>}
                </label>
                <input
                  disabled={isLoading}
                  type="text"
                  id="school"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="School name..."
                  value={school}
                  onChange={(e) => handleSchoolInput(e.target.value)}
                  onFocus={() => setShowSchoolDropdown(true)}
                />
                {showSchoolDropdown && filteredSchools.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredSchools.map((s) => (
                      <div
                        key={s.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSchool(s.name);
                          setSchoolId(s.id);
                          setShowSchoolDropdown(false);
                        }}
                      >
                        {s.name}
                      </div>
                    ))}
                  </div>
                )}
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
