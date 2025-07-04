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

import { ApexOptions } from 'apexcharts';
import { learningTypeColors } from './colorMappings';
import axios from 'axios';

/**
 * Gets the base API URL for either test or production environment
 *
 * TODO: Technical Debt
 * This utility is currently only used in some components.
 * Other components are still using process.env.VITE_API directly.
 * Future work should refactor all API calls to use this function
 * for consistent API URL handling across the application.
 * See the following files that need updating:
 * - CourseDetailsHeader.tsx
 * - Carousel.tsx
 * - WeeklyAttributes.tsx
 * - Searchbar.tsx
 * - Piechart.tsx
 * - Navbar.tsx
 * - Grid.tsx
 * - CreateWorkbookModal.tsx
 * - CourseDetailsEditModal.tsx
 */
export const getApiBaseUrl = () => {
  // In test environment, return a default test URL
  if (process.env.NODE_ENV === 'test') {
    return 'http://test-api';
  }
  // In development/production, use Vite's environment variables
  return process.env.VITE_API;
};

export const FONT_SIZE = '16px';

// =====================
// Type Definitions
// =====================

export interface Area {
  id: string;
  name: string;
}

export interface School {
  id: string;
  name: string;
  area_id: string;
}

export interface GenericData {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
}

export interface LearningPlatform {
  id: string;
  name: string;
}

export interface Activity {
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

export interface Workbook {
  workbook: WorkbookData;
  course_lead: User;
  learning_platform: LearningPlatform;
}

export interface WorkbookData {
  id: string;
  start_date: string;
  end_date: string;
  course_name: string;
  area_id?: string;
  school_id?: string | null;
}

export interface GraduateAttribute {
  id: string;
  name: string;
}

export interface WeeklyGraduateAttribute {
  graduate_attribute_id: string;
  week_workbook_id: string;
  week_number: number;
}

export interface ActivityData {
  id: string;
  name: string;
  time_estimate_minutes: number;
  location: string;
  week_number: number;
  learning_activity: string;
  learning_type: string;
  task_status: string;
  staff: User[];
  workbook_id: string;
}

export interface WeekData {
  staff: string[];
  title: string;
  activity: string;
  type: string;
  time: string;
  status: string;
  location: string;
}

export interface WeekInfo {
  weekNumber: number;
  data: WeekData[];
}

export interface LearningActivity {
  id: string;
  name: string;
  platform_id: string;
}

export interface ActivityStaff {
  staff_id: string;
  activity_id: string;
}

export interface WorkbookDetailsResponse {
  workbook: WorkbookData;
  course_lead: User;
  learning_platform: LearningPlatform;
  activities: ActivityData[];
}

export interface UserExtended {
  id: string;
  name: string;
  permissions_group_id: string;
}

// =====================
// Utility Functions
// =====================

export const getUsername = async (): Promise<string> => {
  return axios
    .get(`${getApiBaseUrl()}/session/`, {
      withCredentials: true,
    })
    .then((sessionResponse) => {
      // Get user details using the user_id from session
      console.log(sessionResponse);
      return axios.get(`${getApiBaseUrl()}/users/`).then((usersResponse) => ({
        sessionData: sessionResponse.data,
        users: usersResponse.data,
      }));
    })
    .then(({ sessionData, users }) => {
      const currentUser = users.find((user: { id: string }) => user.id === sessionData.user_id);
      if (currentUser) {
        return currentUser.name;
      }
      return '';
    })
    .catch((error) => {
      console.error('Error fetching user data:', error);
      return ''; // Reset username on error
    });
};

export const getUser = async (): Promise<UserExtended> => {
  return axios
    .get(`${getApiBaseUrl()}/session/`, {
      withCredentials: true,
    })
    .then((sessionResponse) => {
      // Get user details using the user_id from session
      return axios.get(`${getApiBaseUrl()}/users/`).then((usersResponse) => ({
        sessionData: sessionResponse.data,
        users: usersResponse.data,
      }));
    })
    .then(({ sessionData, users }) => {
      const currentUser = users.find((user: { id: string }) => user.id === sessionData.user_id);
      if (currentUser) {
        return currentUser;
      }
      return '';
    })
    .catch((error) => {
      console.error('Error fetching user data:', error);
      return ''; // Reset username on error
    });
};

export const getContributors = async (workbook_id: string): Promise<User[]> => {
  return (
    await axios.get<User[]>(`${getApiBaseUrl()}/workbook-contributors/`, {
      params: { workbook_id: workbook_id },
    })
  ).data;
};

export const isCourseLead = async (workbook_id: string): Promise<boolean> => {
  const [workbookData, isAdminUser] = await Promise.all([
    axios
      .get<WorkbookDetailsResponse>(`${getApiBaseUrl()}/workbooks/${workbook_id}/details`)
      .then((res) => res.data),
    isAdmin(),
  ]);

  return getUser().then((user) => {
    if (workbookData.course_lead.id === user.id || isAdminUser) {
      return true;
    }
    return false;
  });
};

export const isAdmin = async (): Promise<boolean> => {
  return getUser().then((user) => {
    return axios.get(`${getApiBaseUrl()}/permissions-groups/`).then((response) => {
      const permissionsGroups = response.data;
      const userGroup = permissionsGroups.find(
        (group: { id: string }) => group.id === user.permissions_group_id
      );
      return userGroup?.name === 'Admin';
    });
  });
};

export const canUserEdit = async (workbook_id: string): Promise<boolean> => {
  const [workbookData, contributors, isAdminUser] = await Promise.all([
    axios
      .get<WorkbookDetailsResponse>(`${getApiBaseUrl()}/workbooks/${workbook_id}/details`)
      .then((res) => res.data),
    getContributors(workbook_id),
    isAdmin(),
  ]);

  return getUser().then((user) => {
    if (
      workbookData.course_lead.id === user.id ||
      contributors.some((con) => con.id === user.id) ||
      isAdminUser
    ) {
      return true;
    }
    return false;
  });
};

// EditWorkbook specific utilities
export const defaultActivityForm: Partial<Activity> = {
  name: '',
  time_estimate_minutes: 0,
  location_id: '',
  learning_activity_id: '',
  learning_type_id: '',
  task_status_id: '',
  staff_id: '',
};

export const formatISODate = (date: Date) => date.toISOString().split('T')[0];

export const recalcWeeks = (startDate: string, weeksList: Week[]): Week[] =>
  weeksList.map((week, idx) => {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + idx * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return {
      ...week,
      start_date: formatISODate(weekStart),
      end_date: formatISODate(weekEnd),
    };
  });

export const validateActivity = (activity: Partial<Activity>): string[] => {
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

export const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'An error occurred';

export const timeToMinutes = (time: string): number => {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr) || 0;
  const minutes = parseInt(minutesStr) || 0;
  return hours * 60 + minutes;
};

export const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const calculateLearningTypeMinutes = (weekData: WeekData[]): { [key: string]: number } => {
  const totals: { [key: string]: number } = {};
  weekData.forEach((activity) => {
    const minutes = timeToMinutes(activity.time);
    const type = activity.type.toLowerCase();
    totals[type] = (totals[type] || 0) + minutes;
  });
  return totals;
};

export const calculateTotalMinutes = (weekData: WeekData[]): number => {
  return weekData.reduce((total, activity) => total + timeToMinutes(activity.time), 0);
};

export const processActivitiesData = (activities: ActivityData[]): WeekInfo[] => {
  const weeksMap: { [key: number]: WeekInfo } = {};
  activities.forEach((activity) => {
    const weekNumber = activity.week_number || 1;

    if (!weeksMap[weekNumber]) {
      weeksMap[weekNumber] = {
        weekNumber,
        data: [],
      };
    }
    weeksMap[weekNumber].data.push({
      staff: activity.staff.map((user) => user.name),
      title: activity.name || 'Untitled',
      activity: activity.learning_activity || 'N/A',
      type: activity.learning_type || 'N/A',
      time: activity.time_estimate_minutes
        ? formatMinutes(activity.time_estimate_minutes)
        : '00:00',
      status: activity.task_status || 'Unassigned',
      location: activity.location || 'On Campus',
    });
  });
  const sortedWeeks = Object.values(weeksMap).sort((a, b) => a.weekNumber - b.weekNumber);

  return sortedWeeks;
};

export const prepareDashboardData = (weeksData: WeekInfo[]) => {
  const weekTotals = weeksData.map((week) => ({
    weekNumber: week.weekNumber,
    totals: calculateLearningTypeMinutes(week.data),
    totalMinutes: calculateTotalMinutes(week.data),
  }));

  const maxMinutes = Math.max(...weekTotals.map((week) => week.totalMinutes), 0);
  const yAxisMax = Math.ceil(maxMinutes / 60) * 60 + 60;

  const learningTypesCapitalized = Object.keys(learningTypeColors).map(
    (type) => type.charAt(0).toUpperCase() + type.slice(1)
  );

  const learningTypeUsage: { [key: string]: boolean } = {};
  Object.keys(learningTypeColors).forEach((type) => {
    const isUsed = weekTotals.some(
      (week) => week.totals[type] !== undefined && week.totals[type] > 0
    );
    learningTypeUsage[type] = isUsed;
  });

  const usedLearningTypes = learningTypesCapitalized.filter(
    (type) => learningTypeUsage[type.toLowerCase()]
  );
  const unusedLearningTypes = learningTypesCapitalized.filter(
    (type) => !learningTypeUsage[type.toLowerCase()]
  );
  const allLearningTypes = [...usedLearningTypes, ...unusedLearningTypes];

  const series = allLearningTypes.map((type) => {
    const lowerType = type.toLowerCase();
    return {
      name: type,
      data: weekTotals.map((week) => week.totals[lowerType] || 0),
    };
  });

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      height: 350,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '15%', borderRadius: 5 },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: weekTotals.map((week) => `Week ${week.weekNumber}`),
      axisBorder: { show: true },
      axisTicks: { show: true },
      labels: {
        style: { fontSize: FONT_SIZE },
      },
    },
    yaxis: {
      title: {
        text: 'Hours',
        style: { fontSize: FONT_SIZE },
      },
      min: 0,
      max: yAxisMax,
      tickAmount: yAxisMax / 60,
      labels: {
        style: { fontSize: FONT_SIZE },
        formatter: (value: number) => {
          const hours = Math.floor(value / 60);
          const minutes = value % 60;
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        },
      },
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'left',
      fontSize: '16px',
      formatter: (seriesName: string) => {
        const lowercaseSeriesName = seriesName.toLowerCase();
        const isUsed = learningTypeUsage[lowercaseSeriesName];
        return isUsed ? seriesName : `<span style="color: #999">${seriesName}</span>`;
      },
      markers: {
        width: 12,
        height: 12,
        strokeWidth: 0,
        fillColors: allLearningTypes.map((type) => {
          const lowercaseType = type.toLowerCase();
          const isUsed = learningTypeUsage[lowercaseType];
          return isUsed ? learningTypeColors[lowercaseType] : '#d4d4d4';
        }),
      },
    },
    colors: allLearningTypes.map((type) => {
      const lowercaseType = type.toLowerCase();
      return learningTypeUsage[lowercaseType] ? learningTypeColors[lowercaseType] : '#999';
    }),
    fill: { opacity: 1 },
    grid: {
      show: true,
      borderColor: '#e0e0e0',
      strokeDashArray: 0,
      position: 'back',
    },
  };

  const summaryData = weekTotals.map((week) => {
    const row: { [key: string]: string } = {
      week: `Week ${week.weekNumber}`,
      total: formatMinutes(week.totalMinutes),
    };
    allLearningTypes.forEach((type) => {
      row[type.toLowerCase()] = formatMinutes(week.totals[type.toLowerCase()] || 0);
    });
    return row;
  });

  return { weekTotals, allLearningTypes, series, options, summaryData };
};
