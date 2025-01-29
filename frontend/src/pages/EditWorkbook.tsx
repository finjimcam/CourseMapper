// EditWorkbook.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Tabs, Spinner, Button, Modal, Table, Label, TextInput, Select, Tooltip } from 'flowbite-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { statusColors, learningTypeColors, CustomBadge } from '../components/CustomBadge';
import { HiPencil, HiTrash } from 'react-icons/hi';

interface LearningPlatform {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

interface Activity {
  id?: string;
  name: string;
  time_estimate_minutes: number;
  week_number: number;
  location_id: string;
  learning_activity_id: string;
  learning_type_id: string;
  task_status_id: string;
  staff_id: string;
}

interface Week {
  number: number;
  start_date: string;
  end_date: string;
  activities: Activity[];
}

interface WorkbookData {
  id?: string;
  course_name: string;
  start_date: string;
  end_date: string;
  learning_platform_id: string;
  course_lead_id: string;
}

interface Location {
  id: string;
  name: string;
}

interface LearningActivity {
  id: string;
  name: string;
  platform_id: string;
}

interface LearningType {
  id: string;
  name: string;
}

interface TaskStatus {
  id: string;
  name: string;
}

function EditWorkbook(): JSX.Element {
  const navigate = useNavigate();
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showAddActivityModal, setShowAddActivityModal] = useState<boolean>(false);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [editingWorkbook, setEditingWorkbook] = useState(false);
  const [editedWorkbook, setEditedWorkbook] = useState<WorkbookData | null>(null);
  const [editingActivity, setEditingActivity] = useState<{weekNumber: number, activity: Activity, activityIndex: number} | null>(null);


  // Reference data states
  const [learningPlatforms, setLearningPlatforms] = useState<LearningPlatform[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [learningActivities, setLearningActivities] = useState<LearningActivity[]>([]);
  const [learningTypes, setLearningTypes] = useState<LearningType[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // New activity form state
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    name: '',
    time_estimate_minutes: 0,
    location_id: '',
    learning_activity_id: '',
    learning_type_id: '',
    task_status_id: '',
    staff_id: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const storedData = sessionStorage.getItem('newWorkbookData');
        if (!storedData) {
          throw new Error('No workbook data found');
        }

        const data = JSON.parse(storedData);
        setWorkbookData({
          course_name: data.courseName,
          start_date: data.startDate,
          end_date: data.endDate,
          learning_platform_id: data.learningPlatformId,
          course_lead_id: data.courseLeadId
        });

        const [
          locationsRes,
          learningPlatformsRes,
          learningActivitiesRes,
          learningTypesRes,
          taskStatusesRes,
          usersRes
        ] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API}/locations/`),
          axios.get(`${import.meta.env.VITE_API}/learning-platforms/`),
          axios.get(`${import.meta.env.VITE_API}/learning-activities/?learning_platform_id=${data.learningPlatformId}`).then(res => {
            console.log('Learning Platform ID:', data.learningPlatformId);
            console.log('Learning Activities Response:', res.data);
            return res;
          }),
          axios.get(`${import.meta.env.VITE_API}/learning-types/`),
          axios.get(`${import.meta.env.VITE_API}/task-statuses/`),
          axios.get(`${import.meta.env.VITE_API}/users/`)
        ]);

        setLocations(locationsRes.data);
        setLearningPlatforms(learningPlatformsRes.data);
        setLearningActivities(learningActivitiesRes.data);
        setLearningTypes(learningTypesRes.data);
        setTaskStatuses(taskStatusesRes.data);
        setUsers(usersRes.data);

        setLoading(false);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Failed to load initial data');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleAddWeek = () => {
    if (!workbookData) return;

    const lastWeek = weeks[weeks.length - 1];
    const newWeekNumber = weeks.length + 1;
    
    let startDate;
    if (lastWeek) {
      // Start date is the day after the last week's end date
      startDate = new Date(lastWeek.end_date);
      startDate.setDate(startDate.getDate() + 1);
    } else {
      // If no weeks exist, use workbook start date
      startDate = new Date(workbookData.start_date);
    }

    // End date is 7 days after start date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const newWeek: Week = {
      number: newWeekNumber,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      activities: []
    };

    const updatedWeeks = [...weeks, newWeek];
    setWeeks(updatedWeeks);

    // Update workbook end date to match the last week's end date
    setWorkbookData(prev => prev ? {
      ...prev,
      end_date: endDate.toISOString().split('T')[0]
    } : null);
    
  };

  const handleDeleteWeek = (weekNumber: number) => {
    if (!workbookData) return;

    // Filter out deleted week and renumber remaining weeks
    const updatedWeeks = weeks.filter(w => w.number !== weekNumber)
      .map((w, idx) => ({...w, number: idx + 1}));
    
    // Recalculate dates for remaining weeks
    const recalculatedWeeks = recalculateWeekDates(workbookData.start_date, updatedWeeks);
    
    // Update workbook end date based on remaining weeks
    if (recalculatedWeeks.length > 0) {
      const lastWeek = recalculatedWeeks[recalculatedWeeks.length - 1];
      setWorkbookData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          end_date: lastWeek.end_date
        };
      });
    } else {
      // If no weeks remain, set end date to start date
      setWorkbookData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          end_date: prev.start_date
        };
      });
    }
    
    // Update weeks after end date is set
    setWeeks(recalculatedWeeks);
  };

  const handleEditWorkbook = () => {
    if (!workbookData) return;
    setEditedWorkbook({...workbookData});
    setEditingWorkbook(true);
  };

  const recalculateWeekDates = (startDate: string, weeksToUpdate: Week[]): Week[] => {
    return weeksToUpdate.map((week, index) => {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(weekStartDate.getDate() + (index * 7));
      
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      return {
        ...week,
        start_date: weekStartDate.toISOString().split('T')[0],
        end_date: weekEndDate.toISOString().split('T')[0]
      };
    });
  };

  const handleSaveWorkbook = () => {
    if (!editedWorkbook) return;
    
    // If start date changed, recalculate all week dates
    if (editedWorkbook.start_date !== workbookData?.start_date) {
      const updatedWeeks = recalculateWeekDates(editedWorkbook.start_date, weeks);
      setWeeks(updatedWeeks);
      
      // Update workbook end date to match last week's end date
      if (updatedWeeks.length > 0) {
        const lastWeek = updatedWeeks[updatedWeeks.length - 1];
        setEditedWorkbook(prev => prev ? {
          ...prev,
          end_date: lastWeek.end_date
        } : null);
      }
    }
    
    setWorkbookData(editedWorkbook);
    setEditingWorkbook(false);
  };

  // Update learning activities when platform changes
  useEffect(() => {
    if (workbookData?.learning_platform_id) {
      console.log('Fetching learning activities for platform:', workbookData.learning_platform_id);
      axios.get(`${import.meta.env.VITE_API}/learning-activities/?learning_platform_id=${workbookData.learning_platform_id}`)
        .then(response => {
          console.log('Updated learning activities:', response.data);
          setLearningActivities(response.data);
        })
        .catch(error => {
          console.error('Failed to fetch learning activities:', error);
        });
    }
  }, [workbookData?.learning_platform_id]);

  const handleEditActivity = (weekNumber: number, activity: Activity, activityIndex: number) => {
    setEditingActivity({weekNumber, activity: {...activity}, activityIndex});
    // Reset learning activity selection since available options might have changed
    setNewActivity({
      ...activity,
      learning_activity_id: ''
    });
    setShowAddActivityModal(true);
  };

  const handleDeleteActivity = (weekNumber: number, activityIndex: number) => {
    setWeeks(weeks.map(week => {
      if (week.number === weekNumber) {
        return {
          ...week,
          activities: week.activities.filter((_, idx) => idx !== activityIndex)
        };
      }
      return week;
    }));
  };

  const handleSaveActivity = () => {
    if (!editingActivity) {
      handleAddActivity();
      return;
    }

    const updatedWeeks = weeks.map(week => {
      if (week.number === editingActivity.weekNumber) {
        return {
          ...week,
          activities: week.activities.map((act, index) => 
            index === editingActivity.activityIndex ? {...newActivity as Activity, week_number: week.number} : act
          )
        };
      }
      return week;
    });

    setWeeks(updatedWeeks);
    setShowAddActivityModal(false);
    setEditingActivity(null);
    setNewActivity({
      name: '',
      time_estimate_minutes: 0,
      location_id: '',
      learning_activity_id: '',
      learning_type_id: '',
      task_status_id: '',
      staff_id: ''
    });
  };

  const handleAddActivity = () => {
    if (selectedWeek === null) return;

    const updatedWeeks = weeks.map(week => {
      if (week.number === selectedWeek) {
        return {
          ...week,
          activities: [...week.activities, {
            ...newActivity as Activity,
            week_number: selectedWeek
          }]
        };
      }
      return week;
    });

    setWeeks(updatedWeeks);
    setShowAddActivityModal(false);
    setNewActivity({
      name: '',
      time_estimate_minutes: 0,
      location_id: '',
      learning_activity_id: '',
      learning_type_id: '',
      task_status_id: '',
      staff_id: ''
    });
  };

  const validateWorkbook = (): string[] => {
    const errors: string[] = [];

    if (!workbookData) {
      errors.push('Workbook data is missing');
      return errors;
    }

    if (!workbookData.course_name) errors.push('Course name is required');
    if (!workbookData.learning_platform_id) errors.push('Learning platform is required');
    if (!workbookData.course_lead_id) errors.push('Course lead is required');

    const startDate = new Date(workbookData.start_date);
    const endDate = new Date(workbookData.end_date);
    if (isNaN(startDate.getTime())) errors.push('Start date is invalid');
    if (isNaN(endDate.getTime())) errors.push('End date is invalid');
    if (startDate >= endDate) errors.push('Start date must be earlier than end date');

    if (weeks.length === 0) {
      errors.push('At least one week is required');
    } else {
      weeks.forEach((week, index) => {
        const weekStart = new Date(week.start_date);
        const weekEnd = new Date(week.end_date);
        
        if (weekStart >= weekEnd) {
          errors.push(`Week ${index + 1}: Start date must be earlier than end date`);
        }
        
        if (week.activities.length === 0) {
          errors.push(`Week ${index + 1}: At least one activity is required`);
        }

        week.activities.forEach((activity, actIndex) => {
          if (!activity.name) errors.push(`Week ${index + 1}, Activity ${actIndex + 1}: Name is required`);
          if (!activity.time_estimate_minutes) errors.push(`Week ${index + 1}, Activity ${actIndex + 1}: Time estimate is required`);
          if (!activity.location_id) errors.push(`Week ${index + 1}, Activity ${actIndex + 1}: Location is required`);
          if (!activity.learning_activity_id) errors.push(`Week ${index + 1}, Activity ${actIndex + 1}: Learning activity is required`);
          if (!activity.learning_type_id) errors.push(`Week ${index + 1}, Activity ${actIndex + 1}: Learning type is required`);
          if (!activity.task_status_id) errors.push(`Week ${index + 1}, Activity ${actIndex + 1}: Task status is required`);
          if (!activity.staff_id) errors.push(`Week ${index + 1}, Activity ${actIndex + 1}: Staff member is required`);
        });
      });
    }

    return errors;
  };

  const handlePublish = async () => {
    if (!workbookData) return;

    const errors = validateWorkbook();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

    try {
      setPublishing(true);
      setError(null);

      const workbookResponse = await axios.post(`${import.meta.env.VITE_API}/workbooks/`, {
        course_name: workbookData.course_name,
        learning_platform_id: workbookData.learning_platform_id,
        course_lead_id: workbookData.course_lead_id,
        start_date: workbookData.start_date,
        end_date: workbookData.end_date
      });

      const workbookId = workbookResponse.data.id;

      for (const week of weeks) {
        await axios.post(`${import.meta.env.VITE_API}/weeks/`, {
          workbook_id: workbookId,
          number: week.number,
          start_date: week.start_date,
          end_date: week.end_date
        });

        await Promise.all(week.activities.map(activity =>
          axios.post(`${import.meta.env.VITE_API}/activities/`, {
            ...activity,
            workbook_id: workbookId
          })
        ));
      }

      sessionStorage.removeItem('newWorkbookData');
      navigate(`/workbook/${workbookId}`);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to publish workbook');
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-10">
        <Spinner aria-label="Loading" size="xl" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  }

  if (!workbookData) {
    return <div className="text-center mt-10">No workbook data available.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Validation Error Modal */}
      <Modal show={showValidationModal} onClose={() => setShowValidationModal(false)}>
        <Modal.Header>Cannot Publish Workbook</Modal.Header>
        <Modal.Body>
          <div className="space-y-2">
            <p className="text-red-500 font-medium">Please fix the following issues:</p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-gray-700">{error}</li>
              ))}
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowValidationModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Workbook Modal */}
      <Modal show={editingWorkbook} onClose={() => setEditingWorkbook(false)}>
        <Modal.Header>Edit Course Details</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="courseName" value="Course Name" />
              <TextInput
                id="courseName"
                value={editedWorkbook?.course_name || ''}
                onChange={(e) => setEditedWorkbook(prev => prev ? {...prev, course_name: e.target.value} : null)}
              />
            </div>
            <div>
              <Label htmlFor="courseLead" value="Course Lead" />
              <Select
                id="courseLead"
                value={editedWorkbook?.course_lead_id || ''}
                onChange={(e) => setEditedWorkbook(prev => prev ? {...prev, course_lead_id: e.target.value} : null)}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="learningPlatform" value="Learning Platform" />
              <div className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900">
                {learningPlatforms.find(p => p.id === editedWorkbook?.learning_platform_id)?.name || 'Not selected'}
              </div>
            </div>
            <div>
              <Label htmlFor="startDate" value="Start Date" />
              <DatePicker
                selected={editedWorkbook ? new Date(editedWorkbook.start_date) : null}
                onChange={(date: Date | null) => {
                  if (!date || !editedWorkbook) return;
                  
                  const newStartDate = date.toISOString().split('T')[0];
                  
                  // Calculate new end date based on number of weeks
                  let newEndDate;
                  if (weeks.length > 0) {
                    // If we have weeks, end date is start date + (number of weeks * 7) - 1
                    const endDate = new Date(date);
                    endDate.setDate(endDate.getDate() + (weeks.length * 7) - 1);
                    newEndDate = endDate.toISOString().split('T')[0];
                  } else {
                    // If no weeks, end date matches start date
                    newEndDate = newStartDate;
                  }
                  
                  setEditedWorkbook(prev => prev ? {
                    ...prev,
                    start_date: newStartDate,
                    end_date: newEndDate
                  } : null);
                }}
                dateFormat="dd/MM/yyyy"
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSaveWorkbook}>Save Changes</Button>
          <Button color="gray" onClick={() => setEditingWorkbook(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

    

      {/* Add/Edit Activity Modal */}
      <Modal show={showAddActivityModal} onClose={() => setShowAddActivityModal(false)}>
        <Modal.Header>{editingActivity ? 'Edit Activity' : 'Add New Activity'}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="activityName" value="Activity Name" />
              <TextInput
                id="activityName"
                value={newActivity.name || ''}
                onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="timeEstimate" value="Time Estimate (minutes)" />
              <TextInput
                id="timeEstimate"
                type="number"
                value={newActivity.time_estimate_minutes || ''}
                onChange={(e) => setNewActivity({ ...newActivity, time_estimate_minutes: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="location" value="Location" />
              <Select
                id="location"
                value={newActivity.location_id || ''}
                onChange={(e) => setNewActivity({ ...newActivity, location_id: e.target.value })}
              >
                <option value="">Select location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="learningActivity" value="Learning Activity" />
              <Select
                id="learningActivity"
                value={newActivity.learning_activity_id || ''}
                onChange={(e) => setNewActivity({ ...newActivity, learning_activity_id: e.target.value })}
              >
                <option value="">Select learning activity</option>
                {learningActivities.map((activity) => (
                  <option key={activity.id} value={activity.id}>{activity.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="learningType" value="Learning Type" />
              <Select
                id="learningType"
                value={newActivity.learning_type_id || ''}
                onChange={(e) => setNewActivity({ ...newActivity, learning_type_id: e.target.value })}
              >
                <option value="">Select learning type</option>
                {learningTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="taskStatus" value="Task Status" />
              <Select
                id="taskStatus"
                value={newActivity.task_status_id || ''}
                onChange={(e) => setNewActivity({ ...newActivity, task_status_id: e.target.value })}
              >
                <option value="">Select status</option>
                {taskStatuses.map((status) => (
                  <option key={status.id} value={status.id}>{status.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="staff" value="Staff Member Responsible" />
              <Select
                id="staff"
                value={newActivity.staff_id || ''}
                onChange={(e) => setNewActivity({ ...newActivity, staff_id: e.target.value })}
              >
                <option value="">Select staff member</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </Select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSaveActivity}>{editingActivity ? 'Save Changes' : 'Add Activity'}</Button>
          <Button color="gray" onClick={() => {
            setShowAddActivityModal(false);
            setEditingActivity(null);
            setNewActivity({
              name: '',
              time_estimate_minutes: 0,
              location_id: '',
              learning_activity_id: '',
              learning_type_id: '',
              task_status_id: '',
              staff_id: ''
            });
          }}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      <div className="bg-white p-6 rounded-lg shadow">
        {/* Course Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <h1 className="text-4xl font-bold text-gray-900">
                  {workbookData.course_name}
                </h1>
                <Button size="xs" color="light" onClick={handleEditWorkbook}>
                  <HiPencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-x-4 gap-y-2 mt-4 px-4 w-full">
                <div className="text-lg text-gray-600 text-center">
                  <p className="font-semibold">Course Lead</p>
                  <p>{users.find(u => u.id === workbookData.course_lead_id)?.name}</p>
                </div>
                <div className="text-lg text-gray-600 text-center">
                  <p className="font-semibold">Platform</p>
                  <p>{learningPlatforms.find(p => p.id === workbookData.learning_platform_id)?.name}</p>
                </div>
                <div className="text-lg text-gray-600 text-center">
                  <p className="font-semibold">Start Date</p>
                  <p>{new Date(workbookData.start_date).toLocaleDateString()}</p>
                </div>
                <div className="text-lg text-gray-600 text-center">
                  <p className="font-semibold">End Date</p>
                  <p>{new Date(workbookData.end_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <Button
              gradientDuoTone="greenToBlue"
              size="lg"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : 'Publish Workbook'}
            </Button>
          </div>
        </div>

        {/* Add Week Button */}
        <div className="mb-6">
          <Button onClick={handleAddWeek}>
            Add Week
          </Button>
        </div>

        {/* Weeks Tabs */}
        <Tabs aria-label="Workbook Tabs">
          {weeks.map((week) => (
            <Tabs.Item key={week.number} title={`Week ${week.number}`}>
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Week {week.number} Activities</h2>
                    <Tooltip content="Delete Week">
                      <Button size="xs" color="light" onClick={() => handleDeleteWeek(week.number)}>
                        <HiTrash className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedWeek(week.number);
                      setShowAddActivityModal(true);
                    }}
                  >
                    Add Activity
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table striped>
                    <Table.Head>
                      <Table.HeadCell>Title / Name</Table.HeadCell>
                      <Table.HeadCell>Learning Activity</Table.HeadCell>
                      <Table.HeadCell>Learning Type</Table.HeadCell>
                      <Table.HeadCell>Activity Location</Table.HeadCell>
                      <Table.HeadCell>Task Status</Table.HeadCell>
                      <Table.HeadCell>Staff Responsible</Table.HeadCell>
                      <Table.HeadCell>Time (minutes)</Table.HeadCell>
                      <Table.HeadCell>Actions</Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                      {week.activities.map((activity, index) => (
                        <Table.Row key={index}>
                          <Table.Cell>{activity.name}</Table.Cell>
                          <Table.Cell>
                            {learningActivities.find(la => la.id === activity.learning_activity_id)?.name}
                          </Table.Cell>
                          <Table.Cell>
                            <CustomBadge
                              label={learningTypes.find(lt => lt.id === activity.learning_type_id)?.name || ''}
                              colorMapping={learningTypeColors}
                            />
                          </Table.Cell>
                          <Table.Cell>
                            {locations.find(l => l.id === activity.location_id)?.name}
                          </Table.Cell>
                          <Table.Cell>
                            <CustomBadge
                              label={taskStatuses.find(ts => ts.id === activity.task_status_id)?.name || ''}
                              colorMapping={statusColors}
                            />
                          </Table.Cell>
                          <Table.Cell>
                            {activity.staff_id ? users.find(u => u.id === activity.staff_id)?.name : 'N/A'}
                          </Table.Cell>
                          <Table.Cell>{activity.time_estimate_minutes}</Table.Cell>
                          <Table.Cell>
                            <div className="flex gap-2">
                              <Tooltip content="Edit Activity">
                              <Button size="xs" color="light" onClick={() => handleEditActivity(week.number, activity, index)}>
                                  <HiPencil className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                              <Tooltip content="Delete Activity">
                                <Button size="xs" color="light" onClick={() => handleDeleteActivity(week.number, index)}>
                                  <HiTrash className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>
              </div>
            </Tabs.Item>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

export default EditWorkbook;
