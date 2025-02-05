import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

import { WorkbookData } from '../utils/workbookUtils';

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
  const { workbook_id } = useParams<{ workbook_id: string }>();

  // Main state
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Modal states for validation errors and workbook edit
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [validationErrors] = useState<string[]>([]);
  const [showWorkbookModal, setShowWorkbookModal] = useState<boolean>(false);

  // Modal states for activity add/edit
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<{ weekNumber: number; activity: Activity; activityIndex: number } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  // State for activity error modal
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
    const fetchWorkbookData = async () => {
      if (!workbook_id) return;
      try {
        setLoading(true);
        setError(null);
        
        // Fetch workbook details
        const workbookResponse = await axios.get(`${import.meta.env.VITE_API}/workbooks/${workbook_id}/details`);
        const workbookDetails = workbookResponse.data;
        
        setWorkbookData({
          id: workbookDetails.workbook.id,
          course_name: workbookDetails.workbook.course_name,
          start_date: workbookDetails.workbook.start_date,
          end_date: workbookDetails.workbook.end_date,
          learning_platform_id: workbookDetails.workbook.learning_platform_id,
          course_lead_id: workbookDetails.workbook.course_lead_id
        });

        // Fetch weeks and activities
        const weeksResponse = await axios.get(`${import.meta.env.VITE_API}/weeks/?workbook_id=${workbook_id}`);
        const weeksData = weeksResponse.data;
        const activitiesResponse = await axios.get(`${import.meta.env.VITE_API}/activities/?workbook_id=${workbook_id}`);
        const activitiesData = activitiesResponse.data;

        // Organize activities by week
        const organizedWeeks = weeksData.map((week: { number: number; start_date: string; end_date: string }) => ({
          number: week.number,
          start_date: week.start_date,
          end_date: week.end_date,
          activities: activitiesData.filter((activity: { week_number: number }) => activity.week_number === week.number)
        }));

        setWeeks(organizedWeeks);

        // Fetch reference data
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
          axios.get(`${import.meta.env.VITE_API}/learning-activities/?learning_platform_id=${workbookDetails.workbook.learning_platform_id}`),
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
        setError((err as Error).message || 'Failed to load workbook data');
        setLoading(false);
      }
    };
    fetchWorkbookData();
  }, [workbook_id]);

  // --- Helpers ---
  const recalculateWeekDates = (startDate: string, weeksToUpdate: Week[]): Week[] =>
    weeksToUpdate.map((week, index) => {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + index * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return { ...week, start_date: weekStart.toISOString().split('T')[0], end_date: weekEnd.toISOString().split('T')[0] };
    });

  const handleAddWeek = async () => {
    if (!workbookData || !workbook_id) return;
    const lastWeek = weeks[weeks.length - 1];
    const newWeekNumber = weeks.length + 1;
      const startDate = lastWeek ? new Date(lastWeek.end_date) : new Date(workbookData.start_date);
    if (lastWeek) startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    try {
      await axios.post(`${import.meta.env.VITE_API}/weeks/`, {
        workbook_id: workbook_id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      const newWeek: Week = {
        number: newWeekNumber,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        activities: []
      };

      setWeeks(prev => [...prev, newWeek]);
      setWorkbookData(prev => prev ? { ...prev, end_date: endDate.toISOString().split('T')[0] } : prev);
    } catch (err) {
      setError((err as Error).message || 'Failed to add week');
    }
  };

  const handleDeleteWeek = async (weekNumber: number) => {
    if (!workbookData || !workbook_id) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API}/weeks/`, {
        data: {
          workbook_id: workbook_id,
          number: weekNumber
        }
      });

      const updatedWeeks = weeks.filter(w => w.number !== weekNumber).map((w, idx) => ({ ...w, number: idx + 1 }));
      const recalculated = recalculateWeekDates(workbookData.start_date, updatedWeeks);
      
      if (recalculated.length > 0) {
        setWorkbookData(prev => prev ? { ...prev, end_date: recalculated[recalculated.length - 1].end_date } : prev);
      } else {
        setWorkbookData(prev => prev ? { ...prev, end_date: prev.start_date } : prev);
      }
      
      setWeeks(recalculated);
    } catch (err) {
      setError((err as Error).message || 'Failed to delete week');
    }
  };

  const handleWorkbookFieldChange = (field: string, value: string) => {
    setWorkbookData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSaveWorkbook = async () => {
    if (!workbookData || !workbook_id) return;
    try {
      await axios.patch(`${import.meta.env.VITE_API}/workbooks/${workbook_id}`, {
        course_name: workbookData.course_name,
        start_date: workbookData.start_date,
        end_date: workbookData.end_date,
        course_lead_id: workbookData.course_lead_id,
        learning_platform_id: workbookData.learning_platform_id
      });

      const updatedWeeks = recalculateWeekDates(workbookData.start_date, weeks);
      setWeeks(updatedWeeks);
      if (updatedWeeks.length > 0) {
        setWorkbookData(prev => prev ? { ...prev, end_date: updatedWeeks[updatedWeeks.length - 1].end_date } : prev);
      }
      setShowWorkbookModal(false);
    } catch (err) {
      setError((err as Error).message || 'Failed to save workbook');
    }
  };

  const handleEditActivity = (activity: Activity, activityIndex: number, weekNumber: number) => {
    setEditingActivity({ weekNumber, activity: { ...activity }, activityIndex });
    setActivityForm(activity);
    setShowActivityModal(true);
  };

  const handleDeleteActivity = async (activityIndex: number, weekNumber: number) => {
    const activity = weeks.find(w => w.number === weekNumber)?.activities[activityIndex];
    if (!activity?.id) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API}/activities/`, {
        params: { activity_id: activity.id }
      });

      setWeeks(prevWeeks =>
        prevWeeks.map(week => {
          if (week.number === weekNumber) {
            return { ...week, activities: week.activities.filter((_, idx) => idx !== activityIndex) };
          }
          return week;
        })
      );
    } catch (err) {
      setError((err as Error).message || 'Failed to delete activity');
    }
  };

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

  const handleSaveActivity = async () => {
    const activityErrors = validateActivity(activityForm);
    if (activityErrors.length > 0) {
      setActivityValidationErrors(activityErrors);
      setShowActivityErrorModal(true);
      return;
    }

    if (selectedWeek === null && !editingActivity) return;

    try {
      if (editingActivity && editingActivity.activity.id) {
        // Update existing activity
        await axios.patch(`${import.meta.env.VITE_API}/activities/${editingActivity.activity.id}`, {
          ...activityForm,
          week_number: editingActivity.weekNumber
        });

        setWeeks(prevWeeks =>
          prevWeeks.map(week => {
            if (week.number === editingActivity.weekNumber) {
              return {
                ...week,
                activities: week.activities.map((act, idx) =>
                  idx === editingActivity.activityIndex ? { ...activityForm, id: act.id, week_number: week.number } as Activity : act
                )
              };
            }
            return week;
          })
        );
      } else if (selectedWeek !== null && workbookData?.id) {
        // Create new activity
        const response = await axios.post(`${import.meta.env.VITE_API}/activities/`, {
          ...activityForm,
          workbook_id: workbookData.id,
          week_number: selectedWeek
        });

        setWeeks(prevWeeks =>
          prevWeeks.map(week => {
            if (week.number === selectedWeek) {
              return {
                ...week,
                activities: [...week.activities, { ...activityForm, id: response.data.id, week_number: selectedWeek } as Activity]
              };
            }
            return week;
          })
        );
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
    } catch (err) {
      setError((err as Error).message || 'Failed to save activity');
    }
  };

  const handleSaveChanges = async () => {
    if (!workbookData || !workbook_id) return;
    try {
      setSaving(true);
      setError(null);

      // Save workbook details
      await axios.patch(`${import.meta.env.VITE_API}/workbooks/${workbook_id}`, {
        course_name: workbookData.course_name,
        start_date: workbookData.start_date,
        end_date: workbookData.end_date,
        course_lead_id: workbookData.course_lead_id,
        learning_platform_id: workbookData.learning_platform_id
      });

      setSaving(false);
      navigate(`/workbook/${workbook_id}`);
    } catch (err) {
      setError((err as Error).message || 'Failed to save changes');
      setSaving(false);
    }
  };

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
      <ErrorModal
        show={showValidationModal}
        title="Cannot Save Changes"
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
          <Button gradientDuoTone="greenToBlue" size="lg" onClick={handleSaveChanges} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
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
