import { useState, useEffect } from 'react';
import { Button, Modal, Label, TextInput, Select } from 'flowbite-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';

interface LearningPlatform {
  id: string;
  name: string;
}

interface User {
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

export function CreateWorkbookModal({ show, onClose, onSubmit }: CreateWorkbookModalProps) {
  const [courseName, setCourseName] = useState('');
  const [learningPlatform, setLearningPlatform] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [coordinators, setCoordinators] = useState<string[]>([]);
  const [learningPlatforms, setLearningPlatforms] = useState<LearningPlatform[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [platformsResponse, usersResponse] = await Promise.all([
          axios.get('http://127.0.0.1:8000/learning-platforms/'),
          axios.get('http://127.0.0.1:8000/users/')
        ]);
        setLearningPlatforms(platformsResponse.data);
        setUsers(usersResponse.data);
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

  const handleSubmit = () => {
    if (!courseName.trim()) {
      setError('Course title is required');
      return;
    }
    if (!learningPlatform) {
      setError('Learning platform is required');
      return;
    }
    if (startDate >= endDate) {
      setError('Start date must be before end date');
      return;
    }

    onSubmit({
      courseName: courseName.trim(),
      learningPlatformId: learningPlatform,
      startDate,
      endDate,
      coordinatorIds: coordinators
    });
    onClose();
  };

  const handleCoordinatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !coordinators.includes(value)) {
      setCoordinators([...coordinators, value]);
    }
    setError(null);
  };

  const removeCoordinator = (id: string) => {
    setCoordinators(coordinators.filter(c => c !== id));
  };

  return (
    <Modal show={show} onClose={onClose}>
      <Modal.Header>Create New Workbook</Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">Loading data...</div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            
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
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="endDate" value="End Date" />
              </div>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => {
                  if (date) {
                    setEndDate(date);
                    setError(null);
                  }
                }}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="coordinators" value="Course Coordinators" />
              </div>
              <Select
                id="coordinators"
                onChange={handleCoordinatorChange}
                value=""
              >
                <option value="">Add coordinator</option>
                {users.map((user) => (
                  !coordinators.includes(user.id) && (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  )
                ))}
              </Select>
              {coordinators.length > 0 && (
                <div className="mt-2 space-y-2">
                  {coordinators.map((id) => {
                    const user = users.find(u => u.id === id);
                    return user && (
                      <div key={id} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <span>{user.name}</span>
                        <Button
                          size="xs"
                          color="gray"
                          onClick={() => removeCoordinator(id)}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleSubmit} disabled={loading}>Create Workbook</Button>
        <Button color="gray" onClick={onClose}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  );
}
