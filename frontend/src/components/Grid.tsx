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

import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Workbook, Area, School } from '../utils/workbookUtils';
import { areaColors } from '../utils/colorMappings';

const Grid: React.FC<{ workbooks: Workbook[] | null }> = ({ workbooks }) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [areasResponse, schoolsResponse] = await Promise.all([
          axios.get(`${process.env.VITE_API}/area/`),
          axios.get(`${process.env.VITE_API}/schools/`)
        ]);
        setAreas(areasResponse.data);
        setSchools(schoolsResponse.data);
      } catch (error) {
        console.error('Error fetching area/school data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getAreaName = (areaId: string | undefined) => {
    if (isLoading) return 'Loading...';
    if (!areaId) {
      return 'N/A';
    }
    if (areas.length === 0) {
      return 'Loading...';
    }
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : 'N/A';
  };

  const getSchoolName = (schoolId: string | null | undefined) => {
    if (isLoading) return 'Loading...';
    if (!schoolId) {
      return 'N/A';
    }
    if (schools.length === 0) {
      return 'Loading...';
    }
    const school = schools.find(s => s.id === schoolId);
    return school ? school.name : 'N/A';
  };

  return (
    <div id='grid-container' className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {(workbooks && workbooks.length!=0) ? (
        workbooks.map((item) => (
          <div
            key={item.workbook.id} id= {item.workbook.id}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-200 overflow-hidden"
          >
            <div 
              className="h-20 relative" 
              style={{ 
                backgroundColor: areaColors[getAreaName(item.workbook.area_id)] || '#f5f5f5',
              }}
            >
              <h6 className="text-lg font-bold p-4">{item.workbook.course_name}</h6>
            </div>
            <div className="p-4">
            <Link to={`/workbook/${item.workbook.id}`} className="block text-gray-800 no-underline">
              <p className="text-gray-500">Lead: {item.course_lead?.name || 'N/A'}</p>
              <p className="text-gray-500">Platform: {item.learning_platform?.name || 'N/A'}</p>
              <p className="text-gray-500">Area: {getAreaName(item.workbook.area_id)}</p>
              <p className="text-gray-500">School: {getSchoolName(item.workbook.school_id)}</p>
            </Link>
            </div>
          </div>
        ))
      ) : (
        <p className="col-span-full text-center text-gray-500">No workbooks found.</p>
      )}
    </div>
  );
};

export default Grid;
