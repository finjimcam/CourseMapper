// src/components/CourseHeader.tsx
import React from 'react';
import { Workbook } from '../utils/workbookUtils';

const CourseHeader: React.FC<{ workbook: Workbook }> = ({ workbook }) => (
  <div className="mb-6">
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
