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

import { useState, useEffect } from 'react';
import { Button, Modal, Label, TextInput, Select } from 'flowbite-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface LearningPlatform {
  id: string;
  name: string;
}

interface CreateWorkbookModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (workbookData: {
    courseName: string;
    learningPlatformId: string;
    startDate: Date;
    endDate: Date;
    coordinatorIds: string[];
  }) => void;
}

export function CreateWorkbookModal({ show, onClose }: CreateWorkbookModalProps) {
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState('');
  const [learningPlatform, setLearningPlatform] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [learningPlatforms, setLearningPlatforms] = useState<LearningPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch and validate learning platforms
        const platformsResponse = await axios.get(
          `${import.meta.env.VITE_API}/learning-platforms/`
        );
        console.log('Raw platforms response:', platformsResponse.data);

        let platforms;
        try {
          // Ensure we have valid JSON data
          if (typeof platformsResponse.data === 'string') {
            platforms = JSON.parse(platformsResponse.data);
          } else {
            platforms = platformsResponse.data;
          }

          // Validate platform structure
          if (!Array.isArray(platforms)) {
            throw new Error('Platforms data is not an array');
          }

          // Validate each platform object
          platforms = platforms.filter((p) => p && typeof p === 'object' && p.id && p.name);

          if (platforms.length === 0) {
            throw new Error('No valid learning platforms found');
          }

          console.log('Processed platforms:', platforms);
          setLearningPlatforms(platforms);
        } catch (err) {
          console.error('Platform processing error:', err);
          setError('Failed to process learning platforms data');
          setLoading(false);
          return;
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      fetchData();
    }
  }, [show]);

  const handleSubmit = async () => {
    if (!courseName.trim()) {
      setError('Course title is required');
      return;
    }
    if (!learningPlatform) {
      setError('Learning platform is required');
      return;
    }

    try {
      // Validate selections against existing data
      const selectedPlatform = learningPlatforms.find((p) => p.id === learningPlatform);

      if (!selectedPlatform) {
        setError('Invalid learning platform selected');
        return;
      }

      // Store the validated data
      const workbookData = {
        platformName: selectedPlatform.name,
        courseName: courseName.trim(),
        learningPlatformId: learningPlatform,
        startDate: startDate.toISOString().split('T')[0],
        endDate: startDate.toISOString().split('T')[0], // Initially same as start date, will be updated based on weeks
      };

      console.log('Storing workbook data:', workbookData);

      // Store in sessionStorage and navigate to EditWorkbook
      sessionStorage.setItem('newWorkbookData', JSON.stringify(workbookData));
      onClose();
      navigate('/workbooks/create');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        if (err.config?.url?.includes('learning-platforms')) {
          setError('Invalid learning platform selected');
        } else if (err.config?.url?.includes('users')) {
          setError('Invalid course lead selected');
        } else {
          setError('Resource not found');
        }
      } else {
        setError('Failed to validate selection');
      }
    }
  };

  return (
    <Modal show={show} onClose={onClose}>
      <Modal.Header>Create New Workbook</Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">Loading data...</div>
        ) : (
          <div className="space-y-6">
            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div>
              <div className="mb-2 block">
                <Label htmlFor="courseName" value="Course Title" />
              </div>
              <TextInput
                id="courseName"
                value={courseName}
                onChange={(e) => {
                  setCourseName(e.target.value);
                  setError(null);
                }}
                required
              />
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="learningPlatform" value="Learning Platform" />
              </div>
              <Select
                id="learningPlatform"
                value={learningPlatform}
                onChange={(e) => {
                  setLearningPlatform(e.target.value);
                  setError(null);
                }}
                required
              >
                <option value="">Select platform</option>
                {learningPlatforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="startDate" value="Start Date" />
              </div>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => {
                  if (date) {
                    setStartDate(date);
                    setError(null);
                  }
                }}
                dateFormat="dd/MM/yyyy"
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleSubmit} disabled={loading}>
          Create Workbook
        </Button>
        <Button color="gray" onClick={onClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
