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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Spinner, Button } from 'flowbite-react';
import { HiPencil } from 'react-icons/hi';

import CourseHeader from '../components/CourseDetailsHeader';
import WeeksTabs from '../components/WeekActivityTabEdit';
import ErrorModal from '../components/modals/ErrorModal';
import CourseDetailsEditModal from '../components/modals/CourseDetailsEditModal';
import ActivityModal from '../components/modals/ActivityModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import {
  User,
  LearningPlatform,
  formatMinutes,
  Week,
  Activity,
  WeekInfo,
  Workbook,
  GenericData,
  getErrorMessage,
  LearningActivity,
  defaultActivityForm,
  formatISODate,
} from '../utils/workbookUtils';

// =====================
// Component: CreateWorkbook
// =====================
function CreateWorkbook(): JSX.Element {
  const navigate = useNavigate();

  // Main state
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [contributors, setContributors] = useState<User[]>([]);

  // Modal states
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showWorkbookModal, setShowWorkbookModal] = useState<boolean>(false);
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [showActivityErrorModal, setShowActivityErrorModal] = useState<boolean>(false);
  const [showDeleteWeekModal, setShowDeleteWeekModal] = useState<boolean>(false);
  const [weekToDelete, setWeekToDelete] = useState<number | null>(null);
  const [showDeleteActivityModal, setShowDeleteActivityModal] = useState<boolean>(false);
  const [activityToDelete, setActivityToDelete] = useState<{
    weekNumber: number;
    activityIndex: number;
  } | null>(null);

  // Activity form & editing state
  const [activityForm, setActivityForm] = useState<Partial<Activity>>(defaultActivityForm);
  const [editingActivity, setEditingActivity] = useState<{
    weekNumber: number;
    activity: Activity;
    activityIndex: number;
  } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [activityValidationErrors, setActivityValidationErrors] = useState<string[]>([]);

  // Reference data states
  const [locations, setLocations] = useState<GenericData[]>([]);
  const [learningPlatforms, setLearningPlatforms] = useState<LearningPlatform[]>([]);
  const [learningActivities, setLearningActivities] = useState<LearningActivity[]>([]);
  const [learningTypes, setLearningTypes] = useState<GenericData[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<GenericData[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const storedData = sessionStorage.getItem('newWorkbookData');
        if (!storedData) throw new Error('No workbook data found');

        const data = JSON.parse(storedData);

        // Get user session data for current user
        const sessionResponse = await axios.get(`${process.env.VITE_API}/session/`, {
          withCredentials: true,
        });

        const [locationsRes, platformsRes, learningTypesRes, taskStatusesRes, usersRes] =
          await Promise.all([
            axios.get(`${process.env.VITE_API}/locations/`),
            axios.get(`${process.env.VITE_API}/learning-platforms/`),
            axios.get(`${process.env.VITE_API}/learning-types/`),
            axios.get(`${process.env.VITE_API}/task-statuses/`),
            axios.get(`${process.env.VITE_API}/users/`),
          ]);

        // Get the learning activities for the selected platform
        const activitiesRes = await axios.get(
          `${process.env.VITE_API}/learning-activities/?learning_platform_id=${data.learningPlatformId}`
        );

        // Find current user details
        const currentUser = usersRes.data.find((u: User) => u.id === sessionResponse.data.user_id);

        // Find platform details
        const platform = platformsRes.data.find(
          (p: LearningPlatform) => p.id === data.learningPlatformId
        );

        if (!currentUser) throw new Error('Current user not found');
        if (!platform) throw new Error('Selected platform not found');

        setWorkbook({
          workbook: {
            id: 'temp',
            course_name: data.courseName,
            start_date: data.startDate,
            end_date: data.endDate,
            area_id: data.areaId,
            school_id: data.schoolId,
          },
          learning_platform: {
            id: platform.id,
            name: platform.name,
          },
          course_lead: {
            id: currentUser.id,
            name: currentUser.name,
          },
        });

        setLocations(locationsRes.data);
        setLearningPlatforms(platformsRes.data);
        setLearningActivities(activitiesRes.data);
        setLearningTypes(learningTypesRes.data);
        setTaskStatuses(taskStatusesRes.data);
        setUsers(usersRes.data);

        setLoading(false);
      } catch (err) {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

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
      start_date: formatISODate(startDate),
      end_date: formatISODate(endDate),
      activities: [],
    };

    setWeeks((prev) => [...prev, newWeek]);
    setWorkbook((prev) =>
      prev
        ? {
            ...prev,
            workbook: {
              ...prev.workbook,
              end_date: formatISODate(endDate),
            },
          }
        : prev
    );
  };

  const initiateDeleteWeek = (weekNumber: number) => {
    setWeekToDelete(weekNumber);
    setShowDeleteWeekModal(true);
  };

  const handleDeleteWeek = () => {
    setShowDeleteWeekModal(false);
    if (weekToDelete === null) return;

    const updatedWeeks = weeks
      .filter((w) => w.number !== weekToDelete)
      .map((w, idx) => ({ ...w, number: idx + 1 }));
    setWeeks(updatedWeeks);

    if (workbook && updatedWeeks.length > 0) {
      const lastWeek = updatedWeeks[updatedWeeks.length - 1];
      setWorkbook((prev) =>
        prev
          ? {
              ...prev,
              workbook: {
                ...prev.workbook,
                end_date: lastWeek.end_date,
              },
            }
          : prev
      );
    }
    setWeekToDelete(null);
  };

  const handleWorkbookFieldChange = (field: string, value: string) => {
    if (!workbook) return;

    if (field === 'learning_platform_id') {
      setWorkbook((prev) =>
        prev
          ? {
              ...prev,
              learning_platform: { ...prev.learning_platform, id: value },
            }
          : prev
      );
      // Fetch new learning activities for the selected platform
      axios
        .get(`${process.env.VITE_API}/learning-activities/?learning_platform_id=${value}`)
        .then((res) => setLearningActivities(res.data))
        .catch((err) => setError(getErrorMessage(err)));
    } else if (field === 'contributors') {
      const contributorData: string[] = value.split(',');
      const newContributor: User = { id: contributorData[0], name: contributorData[1] };

      for (let i = 0; i < contributors.length; i++) {
        if (contributors[i].id === newContributor.id) {
          setContributors(contributors.filter((item) => item.id !== newContributor.id));
          return;
        }
      }

      setContributors([...contributors, newContributor]);
    } else {
      setWorkbook((prev) =>
        prev ? { ...prev, workbook: { ...prev.workbook, [field]: value } } : prev
      );
    }
  };

  const handleEditActivity = (activity: Activity, activityIndex: number, weekNumber: number) => {
    setEditingActivity({
      weekNumber,
      activity: { ...activity },
      activityIndex,
    });
    setActivityForm(activity);
    setShowActivityModal(true);
  };

  const initiateDeleteActivity = (activityIndex: number, weekNumber: number) => {
    setActivityToDelete({ weekNumber, activityIndex });
    setShowDeleteActivityModal(true);
  };

  const handleDeleteActivity = () => {
    setShowDeleteActivityModal(false);
    if (!activityToDelete) return;

    setWeeks((prevWeeks) =>
      prevWeeks.map((week) =>
        week.number === activityToDelete.weekNumber
          ? {
              ...week,
              activities: week.activities.filter(
                (_, idx) => idx !== activityToDelete.activityIndex
              ),
            }
          : week
      )
    );
    setActivityToDelete(null);
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

  const validateWorkbook = (): string[] => {
    const errs: string[] = [];
    if (!workbook) {
      errs.push('Workbook data is missing');
      return errs;
    }
    if (!workbook.workbook.course_name) errs.push('Course name is required');
    if (!workbook.learning_platform.id) errs.push('Learning platform is required');
    if (weeks.length === 0) errs.push('At least one week is required');

    const start = new Date(workbook.workbook.start_date);
    const end = new Date(workbook.workbook.end_date);
    if (isNaN(start.getTime())) errs.push('Start date is invalid');
    if (isNaN(end.getTime())) errs.push('End date is invalid');
    if (start >= end) errs.push('Start date must be earlier than end date');

    return errs;
  };

  const handleSaveActivity = () => {
    const activityErrors = validateActivity(activityForm);
    if (activityErrors.length > 0) {
      setActivityValidationErrors(activityErrors);
      setShowActivityErrorModal(true);
      return;
    }

    if (editingActivity) {
      setWeeks((prevWeeks) =>
        prevWeeks.map((week) =>
          week.number === editingActivity.weekNumber
            ? {
                ...week,
                activities: week.activities.map((act, idx) =>
                  idx === editingActivity.activityIndex
                    ? ({ ...activityForm, week_number: week.number } as Activity)
                    : act
                ),
              }
            : week
        )
      );
    } else {
      setWeeks((prevWeeks) =>
        prevWeeks.map((week) =>
          week.number === selectedWeek
            ? {
                ...week,
                activities: [
                  ...week.activities,
                  { ...activityForm, week_number: selectedWeek } as Activity,
                ],
              }
            : week
        )
      );
    }
    closeActivityModal();
  };

  const closeActivityModal = () => {
    setShowActivityModal(false);
    setEditingActivity(null);
    setActivityForm(defaultActivityForm);
  };

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
      const storedDataJson = sessionStorage.getItem('newWorkbookData');
      if (!storedDataJson) {
        throw new Error('No workbook data found');
      }
      const storedData = JSON.parse(storedDataJson);

      // Format dates as ISO strings and ensure proper data types
      // Ensure dates are valid
      const startDate = new Date(workbook.workbook.start_date);
      const endDate = new Date(workbook.workbook.end_date);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format');
      }

      const workbookData = {
        course_name: workbook.workbook.course_name,
        learning_platform_id: workbook.learning_platform.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        area_id: storedData.areaId,
        school_id: storedData.schoolId || null,
      };

      const workbookResponse = await axios.post(
        `${process.env.VITE_API}/workbooks/`,
        workbookData
      );
      const workbookId = workbookResponse.data.id;

      // Create weeks and activities
      for (const week of weeks) {
        await axios.post(`${process.env.VITE_API}/weeks/`, {
          workbook_id: workbookId,
          number: week.number,
          start_date: week.start_date,
          end_date: week.end_date,
        });

        // Create activities and link staff
        for (const activity of week.activities) {
          const activityResponse = await axios.post(`${process.env.VITE_API}/activities/`, {
            ...activity,
            workbook_id: workbookId,
          });

          if (activity.staff_id) {
            await axios.post(`${process.env.VITE_API}/activity-staff/`, {
              staff_id: activity.staff_id,
              activity_id: activityResponse.data.id,
            });
          }
        }
      }

      for (let i = 0; i < contributors.length; i++) {
        await axios.post(`${process.env.VITE_API}/workbook-contributors/`, {
          workbook_id: workbookId,
          contributor_id: contributors[i].id,
        });
      }

      sessionStorage.removeItem('newWorkbookData');
      navigate(`/workbook/${workbookId}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('=== Error Response ===');
        console.error('Status:', err.response?.status);
        console.error('Data:', err.response?.data);
        console.error('Headers:', err.response?.headers);

        if (err.response?.status === 422) {
          const errorDetail = err.response.data.detail;
          const errorMessage =
            typeof errorDetail === 'object'
              ? JSON.stringify(errorDetail, null, 2)
              : errorDetail || 'Invalid workbook data';
          setError(`Validation error: ${errorMessage}`);
        } else {
          setError(`API Error: ${err.response?.statusText || 'Unknown error'}`);
        }
      } else {
        setError(getErrorMessage(err));
      }
      setPublishing(false);
      console.error('Full error details:', err);
    }
  };

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
      <ConfirmModal
        show={showDeleteWeekModal}
        title="Delete Week"
        message="Are you sure you want to delete this week? This action cannot be undone."
        onConfirm={handleDeleteWeek}
        onCancel={() => setShowDeleteWeekModal(false)}
      />
      <ConfirmModal
        show={showDeleteActivityModal}
        title="Delete Activity"
        message="Are you sure you want to delete this activity? This action cannot be undone."
        onConfirm={handleDeleteActivity}
        onCancel={() => setShowDeleteActivityModal(false)}
      />
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
      <CourseDetailsEditModal
        show={showWorkbookModal}
        workbook={workbook}
        users={users}
        learningPlatforms={learningPlatforms}
        weeksCount={weeks.length}
        contributors={contributors}
        onSave={() => setShowWorkbookModal(false)}
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
            <CourseHeader workbook={workbook} contributors={contributors} />
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
          onDeleteWeek={initiateDeleteWeek}
          onAddActivity={(weekNumber) => {
            setSelectedWeek(weekNumber);
            setShowActivityModal(true);
          }}
          onEditActivity={handleEditActivity}
          onDeleteActivity={initiateDeleteActivity}
          onWeekChange={(weekNumber) => setSelectedWeek(weekNumber)}
        />
      </div>
    </div>
  );
}

export default CreateWorkbook;
