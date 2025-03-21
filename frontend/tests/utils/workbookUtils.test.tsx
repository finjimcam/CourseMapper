import axios from 'axios';
import { ApexOptions } from 'apexcharts';
import * as workbookUtils from '../../src/utils/workbookUtils';
import type {
  ActivityData,
  WeekData,
  WeekInfo
} from '../../src/utils/workbookUtils';

const {
  getApiBaseUrl,
  getUsername,
  getUser,
  getContributors,
  isCourseLead,
  formatISODate,
  validateActivity,
  getErrorMessage,
  timeToMinutes,
  formatMinutes,
  calculateLearningTypeMinutes,
  calculateTotalMinutes,
  processActivitiesData,
  prepareDashboardData,
} = workbookUtils;

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('workbookUtils', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getApiBaseUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return test URL in test environment', () => {
      process.env.NODE_ENV = 'test';
      expect(getApiBaseUrl()).toBe('http://test-api');
    });

    it('should return VITE_API in development/production', () => {
      process.env.NODE_ENV = 'development';
      process.env.VITE_API = 'http://dev-api';
      expect(getApiBaseUrl()).toBe('http://dev-api');
    });
  });

  describe('API-dependent functions', () => {
    const mockUser = { id: '1', name: 'Test User', permissions_group_id: '1' };
    const mockApiBaseUrl = 'http://test-api';

    beforeEach(() => {
      // Mock getApiBaseUrl
      jest.spyOn(workbookUtils, 'getApiBaseUrl').mockReturnValue(mockApiBaseUrl);
    });

    describe('getUsername', () => {
      it('should return username when session and user data are available', async () => {
        mockedAxios.get
          .mockResolvedValueOnce({ data: { user_id: '1' } }) // session response
          .mockResolvedValueOnce({ data: [mockUser] }); // users response

        const result = await getUsername();
        expect(result).toBe('Test User');
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });

      it('should return empty string when user is not found', async () => {
        mockedAxios.get
          .mockResolvedValueOnce({ data: { user_id: '2' } })
          .mockResolvedValueOnce({ data: [mockUser] });

        const result = await getUsername();
        expect(result).toBe('');
      });

      it('should handle API errors gracefully', async () => {
        mockedAxios.get.mockRejectedValue(new Error('API Error'));
        const result = await getUsername();
        expect(result).toBe('');
      });
    });

    describe('getUser', () => {
      it('should return user object when found', async () => {
        mockedAxios.get
          .mockResolvedValueOnce({ data: { user_id: '1' } })
          .mockResolvedValueOnce({ data: [mockUser] });

        const result = await getUser();
        expect(result).toEqual(mockUser);
      });

      it('should handle API errors', async () => {
        mockedAxios.get.mockRejectedValue(new Error('API Error'));
        const result = await getUser();
        expect(result).toBe('');
      });
    });

    describe('getContributors', () => {
      it('should return contributors for a workbook', async () => {
        const mockContributors = [{ id: '1', name: 'Contributor 1' }];
        mockedAxios.get.mockResolvedValue({ data: mockContributors });

        const result = await getContributors('workbook1');
        expect(result).toEqual(mockContributors);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `${mockApiBaseUrl}/workbook-contributors/`,
          expect.any(Object)
        );
      });
    });

    describe('isCourseLead', () => {
      const mockWorkbookData = {
        workbook: { id: '1' },
        course_lead: { id: '1', name: 'Test Lead' },
        learning_platform: { id: '1', name: 'Platform' },
        activities: [],
      };

      beforeEach(() => {
        // Mock getUser and isAdmin functions
        jest.spyOn(workbookUtils, 'getUser').mockResolvedValue(mockUser);
        jest.spyOn(workbookUtils, 'isAdmin').mockResolvedValue(false);
      });

      it('should return true when user is course lead', async () => {
        mockedAxios.get.mockResolvedValue({ data: mockWorkbookData });
        const result = await isCourseLead('workbook1');
        expect(result).toBe(true);
      });

      it('should return true when user is admin', async () => {
        jest.spyOn(workbookUtils, 'isAdmin').mockResolvedValue(true);
        mockedAxios.get.mockResolvedValue({ data: mockWorkbookData });
        const result = await isCourseLead('workbook1');
        expect(result).toBe(true);
      });

      it('should return false when user is neither course lead nor admin', async () => {
        jest.spyOn(workbookUtils, 'getUser').mockResolvedValue({ ...mockUser, id: '2' });
        mockedAxios.get.mockResolvedValue({ data: mockWorkbookData });
        const result = await isCourseLead('workbook1');
        expect(result).toBe(false);
      });
    });
  });

  describe('Date and time utilities', () => {
    describe('formatISODate', () => {
      it('should format date objects correctly', () => {
        const date = new Date('2025-03-21');
        expect(formatISODate(date)).toBe('2025-03-21');
      });
    });

    describe('timeToMinutes', () => {
      it('should convert time strings to minutes correctly', () => {
        expect(timeToMinutes('01:30')).toBe(90);
        expect(timeToMinutes('02:15')).toBe(135);
        expect(timeToMinutes('00:45')).toBe(45);
      });

      it('should handle invalid inputs', () => {
        expect(timeToMinutes('')).toBe(0);
        expect(timeToMinutes('invalid')).toBe(0);
      });
    });

    describe('formatMinutes', () => {
      it('should format minutes to HH:MM format', () => {
        expect(formatMinutes(90)).toBe('01:30');
        expect(formatMinutes(135)).toBe('02:15');
        expect(formatMinutes(45)).toBe('00:45');
      });

      it('should pad with zeros correctly', () => {
        expect(formatMinutes(5)).toBe('00:05');
        expect(formatMinutes(70)).toBe('01:10');
      });
    });
  });

  describe('Activity data processing', () => {
    describe('processActivitiesData', () => {
      const mockActivities: ActivityData[] = [
        {
          id: '1',
          week_number: 1,
          name: 'Activity 1',
          learning_activity: 'Lab',
          learning_type: 'Practice',
          time_estimate_minutes: 60,
          task_status: 'Completed',
          location: 'Room 101',
          staff: [{ id: '1', name: 'John Doe' }],
          workbook_id: 'wb1'
        },
        {
          id: '2',
          week_number: 1,
          name: 'Activity 2',
          learning_activity: 'Lecture',
          learning_type: 'Acquisition',
          time_estimate_minutes: 90,
          task_status: 'In Progress',
          location: 'Room 102',
          staff: [{ id: '2', name: 'Jane Smith' }],
          workbook_id: 'wb1'
        },
      ];

      it('should transform activities into week info structure', () => {
        const result = processActivitiesData(mockActivities);
        expect(result).toHaveLength(1); // One week
        expect(result[0].weekNumber).toBe(1);
        expect(result[0].data).toHaveLength(2); // Two activities
        
        const firstActivity = result[0].data[0];
        expect(firstActivity.staff).toEqual(['John Doe']);
        expect(firstActivity.title).toBe('Activity 1');
        expect(firstActivity.time).toBe('01:00');
      });

      it('should handle activities with missing properties', () => {
        const incompleteActivity: ActivityData[] = [{
          id: '3',
          week_number: 1,
          name: '',
          time_estimate_minutes: 0,
          location: '',
          learning_activity: '',
          learning_type: '',
          task_status: '',
          staff: [],
          workbook_id: 'wb1'
        }];

        const result = processActivitiesData(incompleteActivity);
        expect(result[0].data[0].title).toBe('Untitled');
        expect(result[0].data[0].time).toBe('00:00');
        expect(result[0].data[0].status).toBe('Unassigned');
      });
    });

    describe('calculateLearningTypeMinutes', () => {
      const mockWeekData: WeekData[] = [
        { staff: ['John'], title: 'Activity 1', activity: 'Lab', type: 'practice', time: '01:30', status: 'Completed', location: 'Room 101' },
        { staff: ['John'], title: 'Activity 2', activity: 'Lab', type: 'practice', time: '00:30', status: 'Completed', location: 'Room 101' },
        { staff: ['Jane'], title: 'Activity 3', activity: 'Lecture', type: 'acquisition', time: '02:00', status: 'In Progress', location: 'Room 102' },
      ];

      it('should correctly sum minutes by learning type', () => {
        const result = calculateLearningTypeMinutes(mockWeekData);
        expect(result.practice).toBe(120); // 1:30 + 0:30 = 120 minutes
        expect(result.acquisition).toBe(120); // 2:00 = 120 minutes
      });

      it('should handle empty arrays', () => {
        const result = calculateLearningTypeMinutes([]);
        expect(result).toEqual({});
      });
    });

    describe('calculateTotalMinutes', () => {
      it('should sum up all activity times correctly', () => {
        const weekData: WeekData[] = [
          { staff: ['John'], title: 'Activity 1', activity: 'Lab', type: 'practice', time: '01:30', status: 'Completed', location: 'Room 101' },
          { staff: ['John'], title: 'Activity 2', activity: 'Lab', type: 'practice', time: '00:45', status: 'Completed', location: 'Room 101' },
          { staff: ['Jane'], title: 'Activity 3', activity: 'Lecture', type: 'acquisition', time: '02:15', status: 'In Progress', location: 'Room 102' },
        ];
        expect(calculateTotalMinutes(weekData)).toBe(270); // 90 + 45 + 135 = 270
      });

      it('should return 0 for empty array', () => {
        const emptyData: WeekData[] = [];
        expect(calculateTotalMinutes(emptyData)).toBe(0);
      });
    });
  });

  describe('Activity validation', () => {
    describe('validateActivity', () => {
      it('should return empty array for valid activity', () => {
        const validActivity = {
          name: 'Test Activity',
          time_estimate_minutes: 60,
          location_id: 'loc1',
          learning_activity_id: 'act1',
          learning_type_id: 'type1',
          task_status_id: 'status1',
          staff_id: 'staff1',
        };
        expect(validateActivity(validActivity)).toHaveLength(0);
      });

      it('should return appropriate errors for missing fields', () => {
        const invalidActivity = {
          name: '',
          time_estimate_minutes: 0,
        };
        const errors = validateActivity(invalidActivity);
        expect(errors).toContain('Activity name is required');
        expect(errors).toContain('Time estimate is required');
        expect(errors).toContain('Location is required');
        expect(errors).toContain('Learning activity is required');
        expect(errors).toContain('Learning type is required');
        expect(errors).toContain('Task status is required');
        expect(errors).toContain('Staff member is required');
      });
    });

    describe('getErrorMessage', () => {
      it('should return error message for Error objects', () => {
        const error = new Error('Test error');
        expect(getErrorMessage(error)).toBe('Test error');
      });

      it('should return default message for non-Error objects', () => {
        expect(getErrorMessage('string error')).toBe('An error occurred');
        expect(getErrorMessage(null)).toBe('An error occurred');
      });
    });
  });

  describe('Dashboard data preparation', () => {
    const mockWeeksData: WeekInfo[] = [
      {
        weekNumber: 1,
        data: [
          { staff: ['John'], title: 'Activity 1', activity: 'Lab', type: 'practice', time: '01:30', status: 'Completed', location: 'Room 101' },
          { staff: ['Jane'], title: 'Activity 2', activity: 'Lecture', type: 'acquisition', time: '02:00', status: 'In Progress', location: 'Room 102' },
        ],
      },
      {
        weekNumber: 2,
        data: [
          { staff: ['John'], title: 'Activity 3', activity: 'Lab', type: 'practice', time: '01:00', status: 'Completed', location: 'Room 101' },
          { staff: ['Jane'], title: 'Activity 4', activity: 'Discussion', type: 'discussion', time: '00:30', status: 'In Progress', location: 'Room 102' },
        ],
      },
    ];

    describe('prepareDashboardData', () => {
      it('should prepare chart data correctly', () => {
        const result = prepareDashboardData(mockWeeksData);
        
        expect(result.weekTotals).toHaveLength(2);
        expect(result.series).toBeDefined();
        expect(result.options).toBeDefined();
        expect(result.summaryData).toHaveLength(2);
      });

      it('should calculate correct y-axis max value', () => {
        const result = prepareDashboardData(mockWeeksData);
        const yAxis = (result.options as ApexOptions).yaxis;
        expect(yAxis).toBeDefined();
        if (yAxis && !Array.isArray(yAxis)) {
          expect(yAxis.max).toBeGreaterThanOrEqual(180); // Max minutes in test data
        }
      });

      it('should identify used learning types correctly', () => {
        const result = prepareDashboardData(mockWeeksData);
        const usedTypes = result.allLearningTypes.filter(type =>
          mockWeeksData.some(week =>
            week.data.some(activity =>
              activity.type.toLowerCase() === type.toLowerCase()
            )
          )
        );
        expect(usedTypes).toContain('Practice');
        expect(usedTypes).toContain('Acquisition');
        expect(usedTypes).toContain('Discussion');
      });

      it('should handle empty weeks data', () => {
        const result = prepareDashboardData([]);
        expect(result.weekTotals).toHaveLength(0);
        expect(result.series).toBeDefined();
        expect(result.summaryData).toHaveLength(0);
      });
    });
  });
});
