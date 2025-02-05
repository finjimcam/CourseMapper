// src/components/CourseHeader.tsx
import React from 'react';
import { WorkbookData, User, LearningPlatform } from '../utils/workbookUtils';

interface CourseHeaderProps {
  workbook: WorkbookData;
  courseLead: User | null;
  learningPlatform: LearningPlatform | null;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({ workbook, courseLead, learningPlatform }) => (
  <div className="mb-6">
    <h1 className="text-4xl font-bold text-gray-900 mb-2">
      {workbook.course_name || 'Course Title'}
    </h1>
    <p className="text-lg text-gray-600">
      Course Lead:{' '}
      {courseLead?.name || <span className="text-gray-500">N/A</span>}
    </p>
    <p className="text-lg text-gray-600">
      Learning Platform:{' '}
      {learningPlatform?.name || <span className="text-gray-500">N/A</span>}
    </p>
    <p className="text-lg text-gray-600">
      Start Date:{' '}
      {workbook.start_date
        ? new Date(workbook.start_date).toLocaleDateString('en-UK')
        : <span className="text-gray-500">N/A</span>}
    </p>
    <p className="text-lg text-gray-600">
      End Date:{' '}
      {workbook.end_date
        ? new Date(workbook.end_date).toLocaleDateString('en-UK')
        : <span className="text-gray-500">N/A</span>}
    </p>
  </div>
);

export default CourseHeader;
