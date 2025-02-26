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

// src/components/WorkbookEditModal.tsx
import React from 'react';
import { Modal, Button, Label, TextInput, Select } from 'flowbite-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { GenericData, Workbook } from '../../utils/workbookUtils';

interface WorkbookEditModalProps {
  show: boolean;
  workbook: Workbook;
  users: GenericData[];
  learningPlatforms: GenericData[];
  weeksCount: number;
  onSave: () => void;
  onCancel: () => void;
  onChange: (field: string, value: string) => void;
}

const WorkbookEditModal: React.FC<WorkbookEditModalProps> = ({
  show,
  workbook,
  users,
  learningPlatforms,
  weeksCount,
  onSave,
  onCancel,
  onChange,
}) => (
  <Modal show={show} onClose={onCancel}>
    <Modal.Header>Edit Course Details</Modal.Header>
    <Modal.Body>
      <div className="space-y-4">
        <div>
          <Label htmlFor="courseName" value="Course Name" />
          <TextInput
            id="courseName"
            value={workbook.workbook.course_name || ''}
            onChange={(e) => onChange('workbook.course_name', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="courseLead" value="Course Lead" />
          <Select
            id="courseLead"
            value={workbook.course_lead.id || ''}
            onChange={(e) => onChange('course_lead.id', e.target.value)}
          >
            {users.map((user: GenericData) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="learningPlatform" value="Learning Platform" />
          <div className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900">
            {learningPlatforms.find((p: GenericData) => p.id === workbook.learning_platform.id)
              ?.name || 'Not selected'}
          </div>
        </div>
        <div>
          <Label htmlFor="startDate" value="Start Date" />
          <DatePicker
            selected={new Date(workbook.workbook.start_date)}
            onChange={(date: Date | null) => {
              if (!date) return;
              const newStartDate = date.toISOString().split('T')[0];
              let newEndDate;
              if (weeksCount > 0) {
                const endDate = new Date(date);
                endDate.setDate(endDate.getDate() + weeksCount * 7 - 1);
                newEndDate = endDate.toISOString().split('T')[0];
              } else {
                newEndDate = newStartDate;
              }
              onChange('start_date', newStartDate);
              onChange('end_date', newEndDate);
            }}
            dateFormat="dd/MM/yyyy"
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5"
          />
        </div>
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button onClick={onSave}>Save Changes</Button>
      <Button color="gray" onClick={onCancel}>
        Cancel
      </Button>
    </Modal.Footer>
  </Modal>
);

export default WorkbookEditModal;
