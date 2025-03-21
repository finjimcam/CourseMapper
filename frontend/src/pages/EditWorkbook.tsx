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
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Spinner, Button } from 'flowbite-react';
import { HiPencil } from 'react-icons/hi';
import ConfirmModal from '../components/modals/ConfirmModal';

import CourseHeader from '../components/CourseDetailsHeader';
import WeeksTabs from '../components/WeekActivityTabEdit';
import ErrorModal from '../components/modals/ErrorModal';
import CourseDetailsEditModal from '../components/modals/CourseDetailsEditModal';
import ActivityModal from '../components/modals/ActivityModal';
import WeeklyAttributes from '../components/WeeklyAttributes';
import {
  WorkbookDetailsResponse,
  User,
  formatMinutes,
  WeekInfo,
  Workbook,
  Activity,
  Week,
  GenericData,
  getErrorMessage,
  getContributors,
  isCourseLead,
  isAdmin,
  LearningActivity,
  ActivityStaff,
  defaultActivityForm,
  formatISODate,
  recalcWeeks,
  validateActivity,
} from '../utils/workbookUtils';

function EditWorkbook(): JSX.Element {
  const navigate = useNavigate();
  const { workbook_id } = useParams<{ workbook_id: string }>();

  // Main state
  const [workbookData, setWorkbookData] = useState<Workbook | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [contributors, setContributors] = useState<User[]>([]);
  const [showDeleteWeekModal, setShowDeleteWeekModal] = useState<boolean>(false);
  const [weekToDelete, setWeekToDelete] = useState<number | null>(null);
  const [showDeleteActivityModal, setShowDeleteActivityModal] = useState<boolean>(false);
  const [activityToDelete, setActivityToDelete] = useState<{
    weekNumber: number;
    activityIndex: number;
  } | null>(null);
  const [showDeleteWorkbookModal, setShowDeleteWorkbookModal] = useState<boolean>(false);
  const [isUserCourseLead, setIsUserCourseLead] = useState<boolean>(false);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false);

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
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [activityValidationErrors, setActivityValidationErrors] = useState<string[]>([]);
  const [showActivityErrorModal, setShowActivityErrorModal] = useState<boolean>(false);

  // Form state for activity
  const [activityForm, setActivityForm] = useState<Partial<Activity>>({
    ...defaultActivityForm,
  });

  // Reference data states
  const [locations, setLocations] = useState<GenericData[]>([]);
  const [learningPlatforms, setLearningPlatforms] = useState<GenericData[]>([]);
  const [learningActivities, setLearningActivities] = useState<LearningActivity[]>([]);
  const [learningTypes, setLearningTypes] = useState<GenericData[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<GenericData[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!workbook_id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch workbook details
        const { data: workbookDetails } = await axios.get<WorkbookDetailsResponse>(
          `${process.env.VITE_API}/workbooks/${workbook_id}/details`
        );
        setWorkbookData({
          workbook: {
            id: workbookDetails.workbook.id,
            course_name: workbookDetails.workbook.course_name,
            start_date: workbookDetails.workbook.start_date,
            end_date: workbookDetails.workbook.end_date,
            area_id: workbookDetails.workbook.area_id,
            school_id: workbookDetails.workbook.school_id,
          },
          learning_platform: {
            id: workbookDetails.learning_platform.id,
            name: workbookDetails.learning_platform.name,
          },
          course_lead: {
            id: workbookDetails.course_lead.id,
            name: workbookDetails.course_lead.name,
          },
        });

        const [contributorsData, isUserCourseLeadData, isUserAdminData] = await Promise.all([
          getContributors(workbookDetails.workbook.id),
          isCourseLead(workbookDetails.workbook.id),
          isAdmin(),
        ]);
        setContributors(contributorsData);
        setIsUserCourseLead(isUserCourseLeadData);
        setIsUserAdmin(isUserAdminData);

        // Fetch weeks, activities and staff-activity relationships
        const [weeksRes, activitiesRes, staffActivitiesRes] = await Promise.all([
          axios.get(`${process.env.VITE_API}/weeks/?workbook_id=${workbook_id}`),
          axios.get(`${process.env.VITE_API}/activities/?workbook_id=${workbook_id}`),
          axios.get(`${process.env.VITE_API}/activity-staff/`),
        ]);
        const weeksData = weeksRes.data;
        const activitiesData = activitiesRes.data;
        const staffActivitiesData = staffActivitiesRes.data;

        // Merge staff info into activities
        const activitiesWithStaff = activitiesData.map((activity: Activity) => {
          const staffActivity = staffActivitiesData.find(
            (sa: ActivityStaff) => sa.activity_id === activity.id
          );
          return { ...activity, staff_id: staffActivity?.staff_id || '' };
        });
        const organizedWeeks = weeksData.map(
          (week: { number: number; start_date: string; end_date: string }) => ({
            number: week.number,
            start_date: week.start_date,
            end_date: week.end_date,
            activities: activitiesWithStaff.filter((a: Activity) => a.week_number === week.number),
          })
        );
        setWeeks(organizedWeeks);

        // Fetch reference data
        const [
          locationsRes,
          learningActivitiesRes,
          learningPlatformsRes,
          learningTypesRes,
          taskStatusesRes,
          usersRes,
        ] = await Promise.all([
          axios.get(`${process.env.VITE_API}/locations/`),
          axios.get(
            `${process.env.VITE_API}/learning-activities/?learning_platform_id=${workbookDetails.learning_platform.id}`
          ),
          axios.get(`${process.env.VITE_API}/learning-platforms/`),
          axios.get(`${process.env.VITE_API}/learning-types/`),
          axios.get(`${process.env.VITE_API}/task-statuses/`),
          axios.get(`${process.env.VITE_API}/users/`),
        ]);
        setLocations(locationsRes.data);
        setLearningActivities(learningActivitiesRes.data);
        setLearningPlatforms(learningPlatformsRes.data);
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

  const handleAddWeek = async () => {
    if (!workbookData || !workbook_id) return;
    const lastWeek = weeks[weeks.length - 1];
    const newWeekNumber = weeks.length + 1;
    let startDate: Date;
    if (lastWeek && lastWeek.end_date) {
      startDate = new Date(lastWeek.end_date);
      startDate.setDate(startDate.getDate() + 1);
    } else if (workbookData && workbookData.workbook.start_date) {
      startDate = new Date(workbookData.workbook.start_date);
    } else {
      setError('Invalid workbook or week data.');
      return;
    }
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    try {
      await axios.post(`${process.env.VITE_API}/weeks/`, {
        workbook_id,
        start_date: formatISODate(startDate),
        end_date: formatISODate(endDate),
      });
      const newWeek: Week = {
        number: newWeekNumber,
        start_date: formatISODate(startDate),
        end_date: formatISODate(endDate),
        activities: [],
      };
      setWeeks((prev) => [...prev, newWeek]);
      setWorkbookData((prev) =>
        prev
          ? {
              ...prev,
              workbook: { ...prev.workbook, end_date: formatISODate(endDate) },
            }
          : prev
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const initiateDeleteWeek = (weekNumber: number) => {
    setWeekToDelete(weekNumber);
    setShowDeleteWeekModal(true);
  };

  const handleDeleteWorkbook = async () => {
    setShowDeleteWorkbookModal(false);
    if (!workbook_id) return;

    try {
      await axios.delete(`${process.env.VITE_API}/workbooks/`, {
        params: { workbook_id },
      });
      navigate('/my-workbooks');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteWeek = async (weekNumber: number) => {
    setShowDeleteWeekModal(false);
    if (!workbookData || !workbook_id) return;
    try {
      await axios.delete(`${process.env.VITE_API}/weeks/`, {
        data: { workbook_id, number: weekNumber },
      });
      const updatedWeeks = weeks
        .filter((w) => w.number !== weekNumber)
        .map((w, idx) => ({ ...w, number: idx + 1 }));
      const recalculated = recalcWeeks(workbookData.workbook.start_date, updatedWeeks);
      setWeeks(recalculated);
      setWorkbookData((prev) =>
        prev
          ? {
              ...prev,
              end_date: recalculated.length
                ? recalculated[recalculated.length - 1].end_date
                : prev.workbook.start_date,
            }
          : prev
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleWorkbookFieldChange = async (field: string, value: string) => {
    const field_name = field.split('.');

    // Update state immediately for live display
    if (field_name[0] === 'workbook') {
      setWorkbookData((prev) =>
        prev ? { ...prev, workbook: { ...prev.workbook, [field_name[1]]: value } } : prev
      );
    } else if (field_name[0] === 'course_lead') {
      setWorkbookData((prev) =>
        prev
          ? {
              ...prev,
              course_lead: { ...prev.course_lead, [field_name[1]]: value },
            }
          : prev
      );
    } else {
      setWorkbookData((prev) =>
        prev
          ? {
              ...prev,
              learning_platform: {
                ...prev.course_lead,
                [field_name[1]]: value,
              },
            }
          : prev
      );
    }

    // Save changes to backend
    if (!workbookData || !workbook_id) return;
    try {
      await axios.patch(`${process.env.VITE_API}/workbooks/${workbook_id}`, {
        course_name: workbookData.workbook.course_name,
        start_date: workbookData.workbook.start_date,
        end_date: workbookData.workbook.end_date,
        course_lead_id: workbookData.course_lead.id,
        learning_platform_id: workbookData.learning_platform.id,
      });

      // Handle week dates if start date changed
      if (field_name[1] === 'start_date') {
        const updatedWeeks = recalcWeeks(value, weeks);
        setWeeks(updatedWeeks);
      }
    } catch (err) {
      console.error('Error saving changes:', getErrorMessage(err));
    }
  };

  const resetActivityForm = () => setActivityForm({ ...defaultActivityForm });

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

  const handleDeleteActivity = async (activityIndex: number, weekNumber: number) => {
    setShowDeleteActivityModal(false);
    const activity = weeks.find((w) => w.number === weekNumber)?.activities[activityIndex];
    if (!activity?.id) return;
    try {
      if (activity.staff_id) {
        await axios.delete(`${process.env.VITE_API}/activity-staff/`, {
          data: { staff_id: activity.staff_id, activity_id: activity.id },
        });
      }
      await axios.delete(`${process.env.VITE_API}/activities/`, {
        params: { activity_id: activity.id },
      });
      setWeeks((prev) =>
        prev.map((week) =>
          week.number === weekNumber
            ? {
                ...week,
                activities: week.activities.filter((_, idx) => idx !== activityIndex),
              }
            : week
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
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
        await axios.patch(`${process.env.VITE_API}/activities/${editingActivity.activity.id}`, {
          ...activityForm,
          week_number: editingActivity.weekNumber,
        });
        if (editingActivity.activity.staff_id !== activityForm.staff_id) {
          if (editingActivity.activity.staff_id) {
            await axios.delete(`${process.env.VITE_API}/activity-staff/`, {
              data: {
                staff_id: editingActivity.activity.staff_id,
                activity_id: editingActivity.activity.id,
              },
            });
          }
          if (activityForm.staff_id) {
            await axios.post(`${process.env.VITE_API}/activity-staff/`, {
              staff_id: activityForm.staff_id,
              activity_id: editingActivity.activity.id,
            });
          }
        }
        setWeeks((prev) =>
          prev.map((week) =>
            week.number === editingActivity.weekNumber
              ? {
                  ...week,
                  activities: week.activities.map((act, idx) =>
                    idx === editingActivity.activityIndex
                      ? ({
                          ...activityForm,
                          id: act.id,
                          week_number: week.number,
                        } as Activity)
                      : act
                  ),
                }
              : week
          )
        );
      } else if (selectedWeek !== null && workbookData?.workbook.id) {
        const { data: newActivity } = await axios.post(`${process.env.VITE_API}/activities/`, {
          ...activityForm,
          workbook_id: workbookData.workbook.id,
          week_number: selectedWeek,
        });
        if (activityForm.staff_id) {
          await axios.post(`${process.env.VITE_API}/activity-staff/`, {
            staff_id: activityForm.staff_id,
            activity_id: newActivity.id,
          });
        }
        setWeeks((prev) =>
          prev.map((week) =>
            week.number === selectedWeek
              ? {
                  ...week,
                  activities: [
                    ...week.activities,
                    {
                      ...activityForm,
                      id: newActivity.id,
                      week_number: selectedWeek,
                    } as Activity,
                  ],
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
    const emptyWeeks = weeks.filter((week) => week.activities.length === 0);
    if (emptyWeeks.length > 0) {
      setValidationErrors(['Please add activities to all weeks before saving.']);
      setShowValidationModal(true);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await axios.patch(`${process.env.VITE_API}/workbooks/${workbook_id}`, {
        course_name: workbookData.workbook.course_name,
        start_date: workbookData.workbook.start_date,
        end_date: workbookData.workbook.end_date,
        course_lead_id: workbookData.course_lead.id,
        learning_platform_id: workbookData.learning_platform.id,
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
  if (!workbookData) return <div className="text-center mt-10">No workbook data available.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <ConfirmModal
        show={showDeleteWeekModal}
        title="Delete Week"
        message="Are you sure you want to delete this week? This action cannot be undone."
        onConfirm={() => weekToDelete !== null && handleDeleteWeek(weekToDelete)}
        onCancel={() => setShowDeleteWeekModal(false)}
      />
      <ConfirmModal
        show={showDeleteWorkbookModal}
        title="Delete Workbook"
        message="Are you sure you want to delete this workbook? This action cannot be undone and will delete all associated weeks and activities."
        onConfirm={handleDeleteWorkbook}
        onCancel={() => setShowDeleteWorkbookModal(false)}
      />
      <ConfirmModal
        show={showDeleteActivityModal}
        title="Delete Activity"
        message="Are you sure you want to delete this activity? This action cannot be undone."
        onConfirm={() =>
          activityToDelete !== null &&
          handleDeleteActivity(activityToDelete.activityIndex, activityToDelete.weekNumber)
        }
        onCancel={() => setShowDeleteActivityModal(false)}
      />
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
      <CourseDetailsEditModal
        show={showWorkbookModal}
        workbook={workbookData}
        users={users}
        learningPlatforms={learningPlatforms}
        weeksCount={weeks.length}
        onCancel={() => setShowWorkbookModal(false)}
        onSave={() => setShowWorkbookModal(false)}
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
        onFieldChange={(field, value) => setActivityForm((prev) => ({ ...prev, [field]: value }))}
      />
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <CourseHeader workbook={workbookData} contributors={contributors} />
            {isUserCourseLead ? (
              <Button size="xs" color="light" onClick={() => setShowWorkbookModal(true)}>
                <HiPencil className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              {isUserAdmin && (
                <Button color="failure" size="lg" onClick={() => setShowDeleteWorkbookModal(true)}>
                  Delete Workbook
                </Button>
              )}
              <Button
                gradientDuoTone="greenToBlue"
                size="lg"
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
            <WeeklyAttributes weekNumber={selectedWeek} workbookId={workbook_id} />
          </div>
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
          onEditActivity={(activity, index, weekNumber) => {
            setSelectedWeek(weekNumber);
            handleEditActivity(activity, index, weekNumber);
          }}
          onDeleteActivity={initiateDeleteActivity}
          onWeekChange={(weekNumber) => setSelectedWeek(weekNumber)}
        />
      </div>
    </div>
  );
}

export default EditWorkbook;
