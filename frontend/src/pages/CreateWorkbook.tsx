// src/pages/CreateWorkbook.tsx
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
import {
  User,
  LearningPlatform,
  formatMinutes,
  Week,
  Activity,
  WeekInfo,
  Workbook,
} from '../utils/workbookUtils';

// =====================
// Constants & Endpoints
// =====================
const API_URL = import.meta.env.VITE_API;

const ENDPOINTS = {
  locations: `${API_URL}/locations/`,
  learningPlatforms: `${API_URL}/learning-platforms/`,
  learningActivities: (platformId: string) =>
    `${API_URL}/learning-activities/?learning_platform_id=${platformId}`,
  learningTypes: `${API_URL}/learning-types/`,
  taskStatuses: `${API_URL}/task-statuses/`,
  users: `${API_URL}/users/`,
  workbooks: `${API_URL}/workbooks/`,
  weeks: `${API_URL}/weeks/`,
  activities: `${API_URL}/activities/`,
  activityStaff: `${API_URL}/activity-staff/`,
};

const initialActivityState: Partial<Activity> = {
  name: '',
  time_estimate_minutes: 0,
  location_id: '',
  learning_activity_id: '',
  learning_type_id: '',
  task_status_id: '',
  staff_id: '',
};

// =====================
// Type Definitions
// =====================

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

// =====================
// Component: EditWorkbook
// =====================
function EditWorkbook(): JSX.Element {
  const navigate = useNavigate();

  // Main state
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<boolean>(false);

  // Modal states
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showWorkbookModal, setShowWorkbookModal] = useState<boolean>(false);
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [showActivityErrorModal, setShowActivityErrorModal] = useState<boolean>(false);

  // Activity form & editing state
  const [activityForm, setActivityForm] = useState<Partial<Activity>>(initialActivityState);
  const [editingActivity, setEditingActivity] = useState<{
    weekNumber: number;
    activity: Activity;
    activityIndex: number;
  } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [activityValidationErrors, setActivityValidationErrors] = useState<string[]>([]);

  // Reference data states
  const [learningPlatforms, setLearningPlatforms] = useState<LearningPlatform[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [learningActivities, setLearningActivities] = useState<LearningActivity[]>([]);
  const [learningTypes, setLearningTypes] = useState<LearningType[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // =====================
  // Effect: Fetch initial data
  // =====================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const storedData = sessionStorage.getItem('newWorkbookData');
        if (!storedData) throw new Error('No workbook data found');

        const data = JSON.parse(storedData);
        setWorkbook({
          workbook: {
            id: 'temp', // Temporary ID for new workbook
            course_name: data.courseName,
            start_date: data.startDate,
            end_date: data.endDate,
          },
          learning_platform: {
            id: data.learningPlatformId,
            name: data.learningPlatform,
          },
          course_lead: {
            id: 'temp',
            name: data.courseLead,
          },
        });

        const [
          locationsRes,
          learningPlatformsRes,
          learningActivitiesRes,
          learningTypesRes,
          taskStatusesRes,
          usersRes,
        ] = await Promise.all([
          axios.get(ENDPOINTS.locations),
          axios.get(ENDPOINTS.learningPlatforms),
          axios.get(ENDPOINTS.learningActivities(data.learningPlatformId)),
          axios.get(ENDPOINTS.learningTypes),
          axios.get(ENDPOINTS.taskStatuses),
          axios.get(ENDPOINTS.users),
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

  // =====================
  // Helper Functions
  // =====================

  /**
   * Recalculate week start/end dates based on workbook start_date.
   */
  const recalculateWeekDates = (startDate: string, weeksToUpdate: Week[]): Week[] =>
    weeksToUpdate.map((week, index) => {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + index * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return {
        ...week,
        start_date: weekStart.toISOString().split('T')[0],
        end_date: weekEnd.toISOString().split('T')[0],
      };
    });

  /**
   * Add a new week based on current weeks and workbook start date.
   */
  const handleAddWeek = () => {
    if (!workbook) return;
    const lastWeek = weeks[weeks.length - 1];
    const newWeekNumber = weeks.length + 1;
    const startDate = new Date(lastWeek ? lastWeek.end_date : workbook.workbook.start_date);
    if (lastWeek) startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const newWeek: Week = {
      number: newWeekNumber,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      activities: [],
    };

    setWeeks((prev) => [...prev, newWeek]);
    setWorkbook((prev) =>
      prev
        ? {
            ...prev,
            workbook: {
              ...prev.workbook,
              end_date: endDate.toISOString().split('T')[0],
            },
          }
        : prev
    );
  };

  /**
   * Delete a week and recalculate remaining weeks.
   */
  const handleDeleteWeek = (weekNumber: number) => {
    if (!workbook) return;
    const updatedWeeks = weeks
      .filter((w) => w.number !== weekNumber)
      .map((w, idx) => ({ ...w, number: idx + 1 }));
    const recalculated = recalculateWeekDates(workbook.workbook.start_date, updatedWeeks);
    setWorkbook((prev) =>
      prev
        ? {
            ...prev,
            workbook: {
              ...prev.workbook,
              end_date:
                recalculated.length > 0
                  ? recalculated[recalculated.length - 1].end_date
                  : prev.workbook.start_date,
            },
          }
        : prev
    );
    setWeeks(recalculated);
  };

  /**
   * Update a field in workbook data.
   */
  const handleWorkbookFieldChange = (field: string, value: string) => {
    if (field === 'learning_platform_id') {
      setWorkbook((prev) =>
        prev
          ? {
              ...prev,
              learning_platform: { ...prev.learning_platform, id: value },
            }
          : prev
      );
    } else if (field === 'course_lead_id' || field === 'course_lead') {
      setWorkbook((prev) =>
        prev ? { ...prev, course_lead: { ...prev.course_lead, id: value } } : prev
      );
    } else {
      setWorkbook((prev) =>
        prev ? { ...prev, workbook: { ...prev.workbook, [field]: value } } : prev
      );
    }
  };

  /**
   * Save workbook modal changes and recalc week dates.
   */
  const handleSaveWorkbook = () => {
    if (workbook) {
      const updatedWeeks = recalculateWeekDates(workbook.workbook.start_date, weeks);
      setWeeks(updatedWeeks);
      setWorkbook((prev) =>
        prev && updatedWeeks.length > 0
          ? {
              ...prev,
              workbook: {
                ...prev.workbook,
                end_date: updatedWeeks[updatedWeeks.length - 1].end_date,
              },
            }
          : prev
      );
    }
    setShowWorkbookModal(false);
  };

  /**
   * Open activity modal for editing an activity.
   */
  const handleEditActivity = (activity: Activity, activityIndex: number, weekNumber: number) => {
    setEditingActivity({
      weekNumber,
      activity: { ...activity },
      activityIndex,
    });
    setActivityForm(activity);
    setShowActivityModal(true);
  };

  /**
   * Delete an activity from a given week.
   */
  const handleDeleteActivity = (activityIndex: number, weekNumber: number) => {
    setWeeks((prevWeeks) =>
      prevWeeks.map((week) =>
        week.number === weekNumber
          ? {
              ...week,
              activities: week.activities.filter((_, idx) => idx !== activityIndex),
            }
          : week
      )
    );
  };

  /**
   * Validate an activity before saving.
   */
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

  /**
   * Save (or update) an activity.
   */
  const handleSaveActivity = () => {
    const activityErrors = validateActivity(activityForm);
    if (activityErrors.length > 0) {
      setActivityValidationErrors(activityErrors);
      setShowActivityErrorModal(true);
      return;
    }
    if (selectedWeek === null) return;

    if (editingActivity) {
      // Update existing activity
      const updatedWeeks = weeks.map((week) => {
        if (week.number === editingActivity.weekNumber) {
          return {
            ...week,
            activities: week.activities.map((act, idx) =>
              idx === editingActivity.activityIndex
                ? ({ ...activityForm, week_number: week.number } as Activity)
                : act
            ),
          };
        }
        return week;
      });
      setWeeks(updatedWeeks);
    } else {
      // Add new activity
      const updatedWeeks = weeks.map((week) =>
        week.number === selectedWeek
          ? {
              ...week,
              activities: [
                ...week.activities,
                { ...activityForm, week_number: selectedWeek } as Activity,
              ],
            }
          : week
      );
      setWeeks(updatedWeeks);
    }
    closeActivityModal();
  };

  /**
   * Reset and close the activity modal.
   */
  const closeActivityModal = () => {
    setShowActivityModal(false);
    setEditingActivity(null);
    setActivityForm(initialActivityState);
  };

  /**
   * Validate the entire workbook before publishing.
   */
  const validateWorkbook = (): string[] => {
    const errs: string[] = [];
    if (!workbook) {
      errs.push('Workbook data is missing');
      return errs;
    }
    if (!workbook.workbook.course_name) errs.push('Course name is required');
    if (!workbook.learning_platform.id) errs.push('Learning platform is required');

    const start = new Date(workbook.workbook.start_date);
    const end = new Date(workbook.workbook.end_date);
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
        if (week.activities.length === 0)
          errs.push(`Week ${idx + 1}: At least one activity is required`);
        week.activities.forEach((activity, actIdx) => {
          if (!activity.name)
            errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Name is required`);
          if (!activity.time_estimate_minutes)
            errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Time estimate is required`);
          if (!activity.location_id)
            errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Location is required`);
          if (!activity.learning_activity_id)
            errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Learning activity is required`);
          if (!activity.learning_type_id)
            errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Learning type is required`);
          if (!activity.task_status_id)
            errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Task status is required`);
          if (!activity.staff_id)
            errs.push(`Week ${idx + 1}, Activity ${actIdx + 1}: Staff member is required`);
        });
      });
    }
    return errs;
  };

  /**
   * Publish workbook by sending the workbook, weeks, and activities data to the API.
   */
  const handlePublish = async () => {
    if (!workbook) return;
    const errs = validateWorkbook();
    if (errs.length > 0) {
      setValidationErrors(errs);
      setShowValidationModal(true);
      return;
    }
    try {
      setPublishing(true);
      setError(null);

      // Create workbook
      const workbookResponse = await axios.post(ENDPOINTS.workbooks, {
        course_name: workbook.workbook.course_name,
        learning_platform_id: workbook.learning_platform.id,
        start_date: workbook.workbook.start_date,
        end_date: workbook.workbook.end_date,
      });
      const workbookId = workbookResponse.data.id;

      // Create weeks and activities
      for (const week of weeks) {
        await axios.post(ENDPOINTS.weeks, {
          workbook_id: workbookId,
          number: week.number,
          start_date: week.start_date,
          end_date: week.end_date,
        });

        // Create activities and link staff
        const activityResponses = await Promise.all(
          week.activities.map((activity) =>
            axios.post(ENDPOINTS.activities, {
              ...activity,
              workbook_id: workbookId,
            })
          )
        );

        await Promise.all(
          activityResponses.map((response, index) => {
            const activity = week.activities[index];
            return activity.staff_id
              ? axios.post(ENDPOINTS.activityStaff, {
                  staff_id: activity.staff_id,
                  activity_id: response.data.id,
                })
              : Promise.resolve();
          })
        );
      }
      sessionStorage.removeItem('newWorkbookData');
      navigate(`/workbook/${workbookId}`);
    } catch (err) {
      setError((err as Error).message || 'Failed to publish workbook');
      setPublishing(false);
    }
  };

  /**
   * Convert a Week to the WeekInfo format for the WeeksTabs component.
   */
  const convertWeekToWeekInfo = (week: Week): WeekInfo => ({
    weekNumber: week.number,
    data: week.activities.map((activity) => ({
      staff: activity.staff_id ? [users.find((u) => u.id === activity.staff_id)?.name || ''] : [],
      title: activity.name,
      activity:
        learningActivities.find((a) => a.id === activity.learning_activity_id)?.name || 'N/A',
      type: learningTypes.find((t) => t.id === activity.learning_type_id)?.name || 'N/A',
      time: formatMinutes(activity.time_estimate_minutes),
      status: taskStatuses.find((ts) => ts.id === activity.task_status_id)?.name || 'N/A',
      location: locations.find((l) => l.id === activity.location_id)?.name || 'N/A',
    })),
  });

  // =====================
  // Render
  // =====================
  if (loading)
    return (
      <div className="text-center mt-10">
        <Spinner aria-label="Loading" size="xl" />
      </div>
    );
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  if (!workbook) return <div className="text-center mt-10">No workbook data available.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Modals */}
      <ErrorModal
        show={showValidationModal}
        title="Cannot Publish Workbook"
        message="Please fix the following issues:"
        errors={validationErrors}
        onClose={() => setShowValidationModal(false)}
        buttonText="Close"
      />
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
        workbook={workbook}
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
        onCancel={closeActivityModal}
        onFieldChange={(field, value) => setActivityForm((prev) => ({ ...prev, [field]: value }))}
      />

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <CourseHeader workbook={workbook} />
            <Button size="xs" color="light" onClick={() => setShowWorkbookModal(true)}>
              <HiPencil className="h-4 w-4" />
            </Button>
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
