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
import { User, LearningPlatform, formatMinutes, WeekInfo, WorkbookData } from '../utils/workbookUtils';

// --- Type definitions ---
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

// --- Helpers & Defaults ---
const api = axios.create({ baseURL: import.meta.env.VITE_API });
const defaultActivityForm: Partial<Activity> = {
  name: '',
  time_estimate_minutes: 0,
  location_id: '',
  learning_activity_id: '',
  learning_type_id: '',
  task_status_id: '',
  staff_id: ''
};
const formatISODate = (date: Date) => date.toISOString().split('T')[0];
const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'An error occurred';

function EditWorkbook(): JSX.Element {
  const navigate = useNavigate();
  const { workbook_id } = useParams<{ workbook_id: string }>();

  // Main state
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Modal states
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showWorkbookModal, setShowWorkbookModal] = useState<boolean>(false);
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<{
    weekNumber: number;
    activity: Activity;
    activityIndex: number;
  } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [activityValidationErrors, setActivityValidationErrors] = useState<string[]>([]);
  const [showActivityErrorModal, setShowActivityErrorModal] = useState<boolean>(false);

  // Form state for activity
  const [activityForm, setActivityForm] = useState<Partial<Activity>>({ ...defaultActivityForm });

  // Reference data states
  const [learningPlatforms, setLearningPlatforms] = useState<LearningPlatform[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [learningActivities, setLearningActivities] = useState<LearningActivity[]>([]);
  const [learningTypes, setLearningTypes] = useState<LearningType[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!workbook_id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch workbook details
        const { data: workbookDetails } = await api.get(`/workbooks/${workbook_id}/details`);
        setWorkbookData({
          id: workbookDetails.workbook.id,
          course_name: workbookDetails.workbook.course_name,
          start_date: workbookDetails.workbook.start_date,
          end_date: workbookDetails.workbook.end_date,
          learning_platform_id: workbookDetails.workbook.learning_platform_id,
          learning_platform: workbookDetails.workbook.learning_platform,
          course_lead_id: workbookDetails.workbook.course_lead_id,
          course_lead: workbookDetails.workbook.course_lead
        });

        // Fetch weeks, activities and staff-activity relationships
        const [weeksRes, activitiesRes, staffActivitiesRes] = await Promise.all([
          api.get(`/weeks/?workbook_id=${workbook_id}`),
          api.get(`/activities/?workbook_id=${workbook_id}`),
          api.get(`/activity-staff/`)
        ]);
        const weeksData = weeksRes.data;
        const activitiesData = activitiesRes.data;
        const staffActivitiesData = staffActivitiesRes.data;

        // Merge staff info into activities
        const activitiesWithStaff = activitiesData.map((activity: Activity) => {
          const staffActivity = staffActivitiesData.find((sa: any) => sa.activity_id === activity.id);
          return { ...activity, staff_id: staffActivity?.staff_id || '' };
        });
        const organizedWeeks = weeksData.map((week: { number: number; start_date: string; end_date: string }) => ({
          number: week.number,
          start_date: week.start_date,
          end_date: week.end_date,
          activities: activitiesWithStaff.filter((a: Activity) => a.week_number === week.number)
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
          api.get(`/locations/`),
          api.get(`/learning-platforms/`),
          api.get(`/learning-activities/?learning_platform_id=${workbookDetails.workbook.learning_platform_id}`),
          api.get(`/learning-types/`),
          api.get(`/task-statuses/`),
          api.get(`/users/`)
        ]);
        setLocations(locationsRes.data);
        setLearningPlatforms(learningPlatformsRes.data);
        setLearningActivities(learningActivitiesRes.data);
        setLearningTypes(learningTypesRes.data);
        setTaskStatuses(taskStatusesRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [workbook_id]);

  // Recalculate week dates based on a new start date
  const recalcWeeks = (startDate: string, weeksList: Week[]): Week[] =>
    weeksList.map((week, idx) => {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + idx * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return { ...week, start_date: formatISODate(weekStart), end_date: formatISODate(weekEnd) };
    });

  const handleAddWeek = async () => {
    if (!workbookData || !workbook_id) return;
    const lastWeek = weeks[weeks.length - 1];
    const newWeekNumber = weeks.length + 1;
    let startDate: Date;
    if (lastWeek && lastWeek.end_date) {
      startDate = new Date(lastWeek.end_date);
      startDate.setDate(startDate.getDate() + 1);
    } else if (workbookData && workbookData.start_date) {
      startDate = new Date(workbookData.start_date);
    } else {
      setError("Invalid workbook or week data.");
      return;
    }
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    try {
      await api.post(`/weeks/`, {
        workbook_id,
        start_date: formatISODate(startDate),
        end_date: formatISODate(endDate)
      });
      const newWeek: Week = {
        number: newWeekNumber,
        start_date: formatISODate(startDate),
        end_date: formatISODate(endDate),
        activities: []
      };
      setWeeks(prev => [...prev, newWeek]);
      setWorkbookData(prev => prev ? { ...prev, end_date: formatISODate(endDate) } : prev);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteWeek = async (weekNumber: number) => {
    if (!workbookData || !workbook_id) return;
    try {
      await api.delete(`/weeks/`, { data: { workbook_id, number: weekNumber } });
      const updatedWeeks = weeks
        .filter(w => w.number !== weekNumber)
        .map((w, idx) => ({ ...w, number: idx + 1 }));
      const recalculated = recalcWeeks(workbookData.start_date, updatedWeeks);
      setWeeks(recalculated);
      setWorkbookData(prev =>
        prev ? { ...prev, end_date: recalculated.length ? recalculated[recalculated.length - 1].end_date : prev.start_date } : prev
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleWorkbookFieldChange = (field: string, value: string) => {
    setWorkbookData(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveWorkbook = async () => {
    if (!workbookData || !workbook_id) return;
    try {
      await api.patch(`/workbooks/${workbook_id}`, {
        course_name: workbookData.course_name,
        start_date: workbookData.start_date,
        end_date: workbookData.end_date,
        course_lead_id: workbookData.course_lead_id,
        learning_platform_id: workbookData.learning_platform_id
      });
      const updatedWeeks = recalcWeeks(workbookData.start_date, weeks);
      setWeeks(updatedWeeks);
      setWorkbookData(prev =>
        prev ? { ...prev, end_date: updatedWeeks.length ? updatedWeeks[updatedWeeks.length - 1].end_date : prev.start_date } : prev
      );
      setShowWorkbookModal(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const resetActivityForm = () => setActivityForm({ ...defaultActivityForm });

  const handleEditActivity = (activity: Activity, activityIndex: number, weekNumber: number) => {
    setEditingActivity({ weekNumber, activity: { ...activity }, activityIndex });
    setActivityForm(activity);
    setShowActivityModal(true);
  };

  const handleDeleteActivity = async (activityIndex: number, weekNumber: number) => {
    const activity = weeks.find(w => w.number === weekNumber)?.activities[activityIndex];
    if (!activity?.id) return;
    try {
      if (activity.staff_id) {
        await api.delete(`/activity-staff/`, { data: { staff_id: activity.staff_id, activity_id: activity.id } });
      }
      await api.delete(`/activities/`, { params: { activity_id: activity.id } });
      setWeeks(prev =>
        prev.map(week =>
          week.number === weekNumber
            ? { ...week, activities: week.activities.filter((_, idx) => idx !== activityIndex) }
            : week
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
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
    const errorsList = validateActivity(activityForm);
    if (errorsList.length) {
      setActivityValidationErrors(errorsList);
      setShowActivityErrorModal(true);
      return;
    }
    try {
      if (editingActivity && editingActivity.activity.id) {
        await api.patch(`/activities/${editingActivity.activity.id}`, {
          ...activityForm,
          week_number: editingActivity.weekNumber
        });
        if (editingActivity.activity.staff_id !== activityForm.staff_id) {
          if (editingActivity.activity.staff_id) {
            await api.delete(`/activity-staff/`, {
              data: { staff_id: editingActivity.activity.staff_id, activity_id: editingActivity.activity.id }
            });
          }
          if (activityForm.staff_id) {
            await api.post(`/activity-staff/`, {
              staff_id: activityForm.staff_id,
              activity_id: editingActivity.activity.id
            });
          }
        }
        setWeeks(prev =>
          prev.map(week =>
            week.number === editingActivity.weekNumber
              ? {
                  ...week,
                  activities: week.activities.map((act, idx) =>
                    idx === editingActivity.activityIndex
                      ? ({ ...activityForm, id: act.id, week_number: week.number } as Activity)
                      : act
                  )
                }
              : week
          )
        );
      } else if (selectedWeek !== null && workbookData?.id) {
        const { data: newActivity } = await api.post(`/activities/`, {
          ...activityForm,
          workbook_id: workbookData.id,
          week_number: selectedWeek
        });
        if (activityForm.staff_id) {
          await api.post(`/activity-staff/`, { staff_id: activityForm.staff_id, activity_id: newActivity.id });
        }
        setWeeks(prev =>
          prev.map(week =>
            week.number === selectedWeek
              ? {
                  ...week,
                  activities: [
                    ...week.activities,
                    { ...activityForm, id: newActivity.id, week_number: selectedWeek } as Activity
                  ]
                }
              : week
          )
        );
      }
      setShowActivityModal(false);
      setEditingActivity(null);
      resetActivityForm();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSaveChanges = async () => {
    if (!workbookData || !workbook_id) return;

    // Check for empty weeks
    const emptyWeeks = weeks.filter(week => week.activities.length === 0);
    if (emptyWeeks.length > 0) {
      setValidationErrors(['Please add activities to all weeks before saving.']);
      setShowValidationModal(true);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.patch(`/workbooks/${workbook_id}`, {
        course_name: workbookData.course_name,
        start_date: workbookData.start_date,
        end_date: workbookData.end_date,
        course_lead_id: workbookData.course_lead_id,
        learning_platform_id: workbookData.learning_platform_id
      });
      setSaving(false);
      navigate(`/workbook/${workbook_id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  const convertWeekToWeekInfo = (week: Week): WeekInfo => ({
    weekNumber: week.number,
    data: week.activities.map(activity => ({
      staff: activity.staff_id ? [users.find(u => u.id === activity.staff_id)?.name || ''] : [],
      title: activity.name,
      activity: learningActivities.find(a => a.id === activity.learning_activity_id)?.name || 'N/A',
      type: learningTypes.find(t => t.id === activity.learning_type_id)?.name || 'N/A',
      time: formatMinutes(activity.time_estimate_minutes),
      status: taskStatuses.find(ts => ts.id === activity.task_status_id)?.name || 'N/A',
      location: locations.find(l => l.id === activity.location_id)?.name || 'N/A'
    }))
  });

  if (loading)
    return (
      <div className="text-center mt-10">
        <Spinner aria-label="Loading" size="xl" />
      </div>
    );
  if (error)
    return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  if (!workbookData)
    return <div className="text-center mt-10">No workbook data available.</div>;

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
          resetActivityForm();
        }}
        onFieldChange={(field, value) =>
          setActivityForm(prev => ({ ...prev, [field]: value }))
        }
      />
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <CourseHeader
              workbook={workbookData}
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
