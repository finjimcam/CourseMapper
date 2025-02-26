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
import React from 'react';
import { Workbook } from '../utils/workbookUtils';

const CourseHeader: React.FC<{ workbook: Workbook }> = ({ workbook }) => (
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
  </div>
);

export default CourseHeader;
