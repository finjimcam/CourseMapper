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

// src/components/CourseHeader.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Workbook, Area, School } from '../utils/workbookUtils';

const CourseHeader: React.FC<{ workbook: Workbook; contributors: User[] }> = ({
  workbook,
  contributors,
}) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [areasResponse, schoolsResponse] = await Promise.all([
          axios.get(`${process.env.VITE_API}/area/`),
          axios.get(`${process.env.VITE_API}/schools/`),
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
    const area = areas.find((a) => a.id === areaId);
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
    const school = schools.find((s) => s.id === schoolId);
    return school ? school.name : 'N/A';
  };

  return (
    <div className="mb-6 text-left">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        {workbook.workbook.course_name || 'Course Title'}
      </h1>
      <p className="text-lg text-gray-600">
        Course Lead: {workbook.course_lead?.name || <span className="text-gray-500">N/A</span>}
      </p>
      <p className="text-lg text-gray-600">
        Learning Platform:{' '}
        {workbook.learning_platform?.name || <span className="text-gray-500">N/A</span>}
      </p>
      <p className="text-lg text-gray-600">Area: {getAreaName(workbook.workbook.area_id)}</p>
      <p className="text-lg text-gray-600">School: {getSchoolName(workbook.workbook.school_id)}</p>
      <p className="text-lg text-gray-600">
        Start Date:{' '}
        {workbook.workbook.start_date ? (
          new Date(workbook.workbook.start_date).toLocaleDateString('en-UK')
        ) : (
          <span className="text-gray-500">N/A</span>
        )}
      </p>
      <p className="text-lg text-gray-600">
        End Date:{' '}
        {workbook.workbook.end_date ? (
          new Date(workbook.workbook.end_date).toLocaleDateString('en-UK')
        ) : (
          <span className="text-gray-500">N/A</span>
        )}
      </p>
      <p className="text-lg text-gray-600">
        Contributors:{' '}
        {contributors ? (
          contributors.map((c: User, index: number) => (
            <span key={c.id}>
              {index ? ', ' : ''} {c.name}
            </span>
          ))
        ) : (
          <span className="text-gray-500">N/A</span>
        )}
      </p>
    </div>
  );
};

export default CourseHeader;
