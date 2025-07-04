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

// src/components/CourseDetailsEditModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Label, TextInput, Select, Tabs, TabItem } from 'flowbite-react';
import DatePicker from 'react-datepicker';
import ConfirmModal from './ConfirmModal';
import 'react-datepicker/dist/react-datepicker.css';
import {
  GenericData,
  Workbook,
  User,
  LearningPlatform,
} from '../../utils/workbookUtils';

interface CourseDetailsEditModalProps {
  show: boolean;
  workbook: Workbook;
  users: GenericData[];
  learningPlatforms: LearningPlatform[];
  weeksCount: number;
  contributors: User[];
  onCancel: () => void;
  onSave: () => void;
  onChange: (field: string, value: string) => void;
}

const CourseDetailsEditModal: React.FC<CourseDetailsEditModalProps> = ({
  show,
  workbook,
  users,
  weeksCount,
  contributors,
  onCancel,
  onChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLeadChangeModal, setShowLeadChangeModal] = useState(false);
  const [newLeadId, setNewLeadId] = useState<string>('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
  }, [contributors]);

  const handleDateChange = (date: Date | null) => {
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
    onChange('workbook.start_date', newStartDate);
    onChange('workbook.end_date', newEndDate);
  };

  return (
    <>
      <ConfirmModal
        show={showLeadChangeModal}
        title="Change Course Lead"
        message="Are you sure you want to change the course lead? This will transfer all course lead permissions to the selected user."
        onConfirm={() => {
          onChange('course_lead.id', newLeadId);
          setShowLeadChangeModal(false);
        }}
        onCancel={() => {
          setShowLeadChangeModal(false);
        }}
      />
      <Modal show={show} onClose={onCancel}>
        <Modal.Header>Edit Course Details</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <Tabs aria-label="Course edit tabs">
              <TabItem title="Details">
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
                      onChange={(e) => {
                        setNewLeadId(e.target.value);
                        setShowLeadChangeModal(true);
                      }}
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
                      {workbook.learning_platform.name || 'Not selected'}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="startDate" value="Start Date" />
                    <DatePicker
                      selected={new Date(workbook.workbook.start_date)}
                      onChange={handleDateChange}
                      dateFormat="dd/MM/yyyy"
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5"
                    />
                  </div>
                </div>
              </TabItem>
              <TabItem title="Contributors">
                <div className="space-y-4">
                  <Label value="Current Contributors" />
                  <div className="space-y-2">
                    {contributors.map((contributor) => (
                      <div
                        key={contributor.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span>{contributor.name}</span>
                        <Button
                          color="failure"
                          size="xs"
                          onClick={() =>
                            onChange('contributors', `${contributor.id},${contributor.name}`)
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="contributorSearch" value="Add Contributor" />
                    <div className="relative">
                      <TextInput
                        id="contributorSearch"
                        type="text"
                        placeholder="Search for a user..."
                        value={searchQuery}
                        onChange={(e) => {
                          const query = e.target.value;
                          setSearchQuery(query);
                          const filtered = users.filter(
                            (user) =>
                              !contributors.some((c) => c.id === user.id) &&
                              user.name.toLowerCase().includes(query.toLowerCase())
                          );
                          setFilteredUsers(filtered);
                        }}
                      />
                      {searchQuery && filteredUsers.length > 0 && (
                        <div className="absolute z-10 w-full">
                          <div className="bg-white border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                            {filteredUsers.map((user) => (
                              <div
                                key={user.id}
                                className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                                onClick={() => {
                                  onChange('contributors', `${user.id},${user.name}`);
                                  setSearchQuery('');
                                  setFilteredUsers([]);
                                }}
                              >
                                {user.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabItem>
            </Tabs>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={onCancel}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CourseDetailsEditModal;
