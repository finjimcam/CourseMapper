// src/pages/EditWorkbook.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Spinner, Button } from 'flowbite-react';
import { HiPencil } from 'react-icons/hi';

import CourseHeader from '../components/CourseDetailsHeader';
import WeeksTabs from '../components/WeekActivityTabEdit';
import ErrorModal from '../components/modals/ErrorModal';
import WorkbookEditModal from '../components/modals/CourseDetailsEditModal';
import ActivityModal from '../components/modals/ActivityModal';
import { formatMinutes, WeekInfo } from '../utils/workbookUtils';

// --- Type definitions ---
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

export interface Week {
  number: number;
  start_date: string;
  end_date: string;
  activities: Activity[];
}

export interface WorkbookData {
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

  // Main state
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<boolean>(false);

  // Modal states for publishing errors and workbook edit
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showWorkbookModal, setShowWorkbookModal] = useState<boolean>(false);

  // Modal states for activity add/edit
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<{ weekNumber: number; activity: Activity; activityIndex: number } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  // State for activity error modal (to display validation errors on activity save)
  const [activityValidationErrors, setActivityValidationErrors] = useState<string[]>([]);
  const [showActivityErrorModal, setShowActivityErrorModal] = useState<boolean>(false);

  // Form state for activity
  const [activityForm, setActivityForm] = useState<Partial<Activity>>({
    name: '',
    time_estimate_minutes: 0,
    location_id: '',
    learning_activity_id: '',
    learning_type_id: '',
    task_status_id: '',
    staff_id: ''
  });

  // Reference data states
  const [learningPlatforms, setLearningPlatforms] = useState<LearningPlatform[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [learningActivities, setLearningActivities] = useState<LearningActivity[]>([]);
  const [learningTypes, setLearningTypes] = useState<LearningType[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const storedData = sessionStorage.getItem('newWorkbookData');
        if (!storedData) throw new Error('No workbook data found');
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
          axios.get(`${import.meta.env.VITE_API}/learning-activities/?learning_platform_id=${data.learningPlatformId}`),
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
        setError((err as Error).message || 'Failed to load initial data');
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // --- Helpers ---

  const recalculateWeekDates = (startDate: string, weeksToUpdate: Week[]): Week[] =>
    weeksToUpdate.map((week, index) => {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + index * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return { ...week, start_date: weekStart.toISOString().split('T')[0], end_date: weekEnd.toISOString().split('T')[0] };
    });

  const handleAddWeek = () => {
    if (!workbookData) return;
    const lastWeek = weeks[weeks.length - 1];
    const newWeekNumber = weeks.length + 1;
    let startDate = lastWeek ? new Date(lastWeek.end_date) : new Date(workbookData.start_date);
    if (lastWeek) startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const newWeek: Week = {
      number: newWeekNumber,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      activities: []
    };
    setWeeks(prev => [...prev, newWeek]);
    setWorkbookData(prev => prev ? { ...prev, end_date: endDate.toISOString().split('T')[0] } : prev);
  };

  const handleDeleteWeek = (weekNumber: number) => {
    if (!workbookData) return;
    const updatedWeeks = weeks.filter(w => w.number !== weekNumber).map((w, idx) => ({ ...w, number: idx + 1 }));
    const recalculated = recalculateWeekDates(workbookData.start_date, updatedWeeks);
    if (recalculated.length > 0) {
      setWorkbookData(prev => prev ? { ...prev, end_date: recalculated[recalculated.length - 1].end_date } : prev);
    } else {
      setWorkbookData(prev => prev ? { ...prev, end_date: prev.start_date } : prev);
    }
    setWeeks(recalculated);
  };

  const handleWorkbookFieldChange = (field: string, value: string) => {
    setWorkbookData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSaveWorkbook = () => {
    if (workbookData) {
      const updatedWeeks = recalculateWeekDates(workbookData.start_date, weeks);
      setWeeks(updatedWeeks);
      if (updatedWeeks.length > 0) {
        setWorkbookData(prev => prev ? { ...prev, end_date: updatedWeeks[updatedWeeks.length - 1].end_date } : prev);
      }
    }
    setShowWorkbookModal(false);
  };

  // Callback to edit an activity.
  // Signature: (activity, activityIndex, weekNumber)
  const handleEditActivity = (activity: Activity, activityIndex: number, weekNumber: number) => {
    setEditingActivity({ weekNumber, activity: { ...activity }, activityIndex });
    setActivityForm(activity);
    setShowActivityModal(true);
  };

  // Delete activity using functional update.
  // Signature: (activityIndex, weekNumber)
  const handleDeleteActivity = (activityIndex: number, weekNumber: number) => {
    setWeeks(prevWeeks =>
      prevWeeks.map(week => {
        if (week.number === weekNumber) {
          return { ...week, activities: week.activities.filter((_, idx) => idx !== activityIndex) };
        }
        return week;
      })
    );
  };

  // Validate activity data before saving
  const validateActivity = (activity: Partial<Activity>): string[] => {
    const errors: string[] = [];
    if (!activity.name) errors.push('Activity name is required');
    if (!activity.time_estimate_minutes) errors.push('Time estimate is required');
    if (!activity.location_id) errors.push('Location is required');
    if (!activity.learning_activity_id) errors.push('Learning activity is required');
    if (!activity.learning_type_id) errors.push('Learning type is required');
    if (!activity.task_status_id) errors.push('Task status is required');
    if (!activity.staff_id) errors.push('Staff member is required');
    return errors;
  };

  // Save activity (new or edited) after validating required fields
  const handleSaveActivity = () => {
    const activityErrors = validateActivity(activityForm);
    if (activityErrors.length > 0) {
      // Instead of alert, use the ErrorModal to show activity errors.
      setActivityValidationErrors(activityErrors);
      setShowActivityErrorModal(true);
      return;
    }
    if (selectedWeek === null) return;
    if (editingActivity) {
      const updatedWeeks = weeks.map(week => {
        if (week.number === editingActivity.weekNumber) {
          return {
            ...week,
            activities: week.activities.map((act, idx) =>
              idx === editingActivity.activityIndex ? { ...activityForm, week_number: week.number } as Activity : act
            )
          };
        }
        return week;
      });
      setWeeks(updatedWeeks);
    } else {
      const updatedWeeks = weeks.map(week => {
        if (week.number === selectedWeek) {
          return {
            ...week,
            activities: [...week.activities, { ...activityForm, week_number: selectedWeek } as Activity]
          };
        }
        return week;
      });
      setWeeks(updatedWeeks);
    }
    setShowActivityModal(false);
    setEditingActivity(null);
    setActivityForm({
      name: '',
      time_estimate_minutes: 0,
      location_id: '',
      learning_activity_id: '',
      learning_type_id: '',
      task_status_id: '',
      staff_id: ''
    });
  };

  // Validate entire workbook before publishing
  const validateWorkbook = (): string[] => {
    const errs: string[] = [];
    if (!workbookData) {
      errs.push('Workbook data is missing');
      return errs;
    }
    if (!workbookData.course_name) errs.push('Course name is required');
    if (!workbookData.learning_platform_id) errs.push('Learning platform is required');
    if (!workbookData.course_lead_id) errs.push('Course lead is required');
    const start = new Date(workbookData.start_date);
    const end = new Date(workbookData.end_date);
    if (isNaN(start.getTime())) errs.push('Start date is invalid');
    if (isNaN(end.getTime())) errs.push('End date is invalid');
    if (start >= end) errs.push('Start date must be earlier than end date');
    if (weeks.length === 0) {
      errs.push('At least one week is required');
    } else {
      weeks.forEach((week, idx) => {
        const ws = new Date(week.start_date),
              we = new Date(week.end_date);
        if (ws >= we) errs.push(`Week ${idx + 1}: Start date must be earlier than end date`);
        if (week.activities.length === 0) errs.push(`Week ${idx + 1}: At least one activity is required`);
        week.activities.forEach((activity, actIdx) => {
          if (!activity.name) errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Name is required`);
          if (!activity.time_estimate_minutes) errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Time estimate is required`);
          if (!activity.location_id) errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Location is required`);
          if (!activity.learning_activity_id) errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Learning activity is required`);
          if (!activity.learning_type_id) errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Learning type is required`);
          if (!activity.task_status_id) errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Task status is required`);
          if (!activity.staff_id) errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Staff member is required`);
        });
      });
    }
    return errs;
  };

  // Publish workbook by validating and then sending data to the API
  const handlePublish = async () => {
    if (!workbookData) return;
    const errs = validateWorkbook();
    if (errs.length > 0) {
      setValidationErrors(errs);
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
        end_date: workbookData.end_date,
      });
      const workbookId = workbookResponse.data.id;
      for (const week of weeks) {
        await axios.post(`${import.meta.env.VITE_API}/weeks/`, {
          workbook_id: workbookId,
          number: week.number,
          start_date: week.start_date,
          end_date: week.end_date,
        });
        await Promise.all(
          week.activities.map((activity) =>
            axios.post(`${import.meta.env.VITE_API}/activities/`, { ...activity, workbook_id: workbookId })
          )
        );
      }
      sessionStorage.removeItem('newWorkbookData');
      navigate(`/workbook/${workbookId}`);
    } catch (err) {
      setError((err as Error).message || 'Failed to publish workbook');
      setPublishing(false);
    }
  };

  // Helper: Convert a Week to WeekInfo for WeeksTabs
  const convertWeekToWeekInfo = (week: Week): WeekInfo => ({
    weekNumber: week.number,
    data: week.activities.map((activity) => ({
      staff: activity.staff_id ? [users.find((u) => u.id === activity.staff_id)?.name || ''] : [],
      title: activity.name,
      activity: learningActivities.find((a) => a.id === activity.learning_activity_id)?.name || 'N/A',
      type: learningTypes.find((t) => t.id === activity.learning_type_id)?.name || 'N/A',
      time: formatMinutes(activity.time_estimate_minutes),
      status: taskStatuses.find((ts) => ts.id === activity.task_status_id)?.name || 'N/A',
      location: locations.find((l) => l.id === activity.location_id)?.name || 'N/A',
    })),
  });

  if (loading) return <div className="text-center mt-10"><Spinner aria-label="Loading" size="xl" /></div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  if (!workbookData) return <div className="text-center mt-10">No workbook data available.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Error modal for publish validation */}
      <ErrorModal
        show={showValidationModal}
        title="Cannot Publish Workbook"
        message="Please fix the following issues:"
        errors={validationErrors}
        onClose={() => setShowValidationModal(false)}
        buttonText="Close"
      />
      {/* Error modal for activity validation */}
      <ErrorModal
        show={showActivityErrorModal}
        title="Activity Validation Errors"
        message="Please correct the following issues:"
        errors={activityValidationErrors}
        onClose={() => setShowActivityErrorModal(false)}
        buttonText="OK"
      />
      <WorkbookEditModal
        show={showWorkbookModal}
        workbook={workbookData}
        users={users}
        learningPlatforms={learningPlatforms}
        weeksCount={weeks.length}
        onSave={handleSaveWorkbook}
        onCancel={() => setShowWorkbookModal(false)}
        onChange={handleWorkbookFieldChange}
      />
      <ActivityModal
        show={showActivityModal}
        activity={activityForm}
        editing={!!editingActivity}
        locations={locations}
        learningActivities={learningActivities}
        learningTypes={learningTypes}
        taskStatuses={taskStatuses}
        users={users}
        onSave={handleSaveActivity}
        onCancel={() => {
          setShowActivityModal(false);
          setEditingActivity(null);
          setActivityForm({
            name: '',
            time_estimate_minutes: 0,
            location_id: '',
            learning_activity_id: '',
            learning_type_id: '',
            task_status_id: '',
            staff_id: ''
          });
        }}
        onFieldChange={(field, value) => setActivityForm(prev => ({ ...prev, [field]: value }))}
      />

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <CourseHeader
              workbook={workbookData}
              courseLead={users.find((u) => u.id === workbookData.course_lead_id) || null}
              learningPlatform={learningPlatforms.find((p) => p.id === workbookData.learning_platform_id) || null}
            />
            <Button size="xs" color="light" onClick={() => setShowWorkbookModal(true)}>
              <HiPencil className="h-4 w-4" />
            </Button>
          </div>
          <Button gradientDuoTone="greenToBlue" size="lg" onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Publishing...' : 'Publish Workbook'}
          </Button>
        </div>
        <div className="mb-6">
          <Button onClick={handleAddWeek}>Add Week</Button>
        </div>
        <WeeksTabs
          weeks={weeks}
          convertWeekToWeekInfo={convertWeekToWeekInfo}
          onDeleteWeek={handleDeleteWeek}
          onAddActivity={(weekNumber) => {
            setSelectedWeek(weekNumber);
            setShowActivityModal(true);
          }}
          onEditActivity={handleEditActivity}
          onDeleteActivity={handleDeleteActivity}
        />
      </div>
    </div>
  );
}

export default EditWorkbook;
