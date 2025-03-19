import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeekActivityTab from '../../src/components/WeekActivityTab';
import { Activity, WeekInfo } from '../../src/utils/workbookUtils';

// Mock the CustomBadge component
jest.mock('../../src/components/CustomBadge', () => ({
  CustomBadge: ({ label }: { label: string }) => <span data-testid="custom-badge">{label}</span>
}));

// Mock color mappings
jest.mock('../../src/utils/colorMappings', () => ({
  learningTypeColors: {
    'synchronous': '#ff0000',
    'asynchronous': '#00ff00'
  },
  statusColors: {
    'complete': '#0000ff',
    'pending': '#ffff00'
  }
}));

describe('WeekActivityTab', () => {
  const mockWeekInfo: WeekInfo = {
    weekNumber: 1,
    data: [
      {
        staff: ['John Doe'],
        title: 'Activity 1',
        activity: 'Lecture',
        type: 'Synchronous',
        location: 'Room 101',
        status: 'Complete',
        time: '01:30'
      },
      {
        staff: ['Jane Smith', 'Bob Wilson'],
        title: 'Activity 2',
        activity: 'Workshop',
        type: 'Asynchronous',
        location: 'Online',
        status: 'Pending',
        time: '02:00'
      }
    ]
  };

  const mockOriginalActivities: Activity[] = [
    {
      id: '1',
      name: 'Activity 1',
      time_estimate_minutes: 90,
      week_number: 1,
      location_id: 'loc1',
      learning_activity_id: 'la1',
      learning_type_id: 'lt1',
      task_status_id: 'ts1',
      staff_id: 'staff1'
    },
    {
      id: '2',
      name: 'Activity 2',
      time_estimate_minutes: 120,
      week_number: 1,
      location_id: 'loc2',
      learning_activity_id: 'la2',
      learning_type_id: 'lt2',
      task_status_id: 'ts2',
      staff_id: 'staff2'
    }
  ];

  describe('Basic Rendering', () => {
    it('should render week number correctly', () => {
      render(<WeekActivityTab week={mockWeekInfo} />);
      expect(screen.getByText('Week 1 Activities')).toBeInTheDocument();
    });

    it('should render all table headers', () => {
      render(<WeekActivityTab week={mockWeekInfo} />);
      expect(screen.getByText('Staff Responsible')).toBeInTheDocument();
      expect(screen.getByText('Title / Name')).toBeInTheDocument();
      expect(screen.getByText('Learning Activity')).toBeInTheDocument();
      expect(screen.getByText('Learning Type')).toBeInTheDocument();
      expect(screen.getByText('Activity Location')).toBeInTheDocument();
      expect(screen.getByText('Task Status')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
    });

    it('should render empty week data gracefully', () => {
      const emptyWeek: WeekInfo = {
        weekNumber: 1,
        data: []
      };
      render(<WeekActivityTab week={emptyWeek} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should render all activity data correctly', () => {
      render(<WeekActivityTab week={mockWeekInfo} />);
      
      // Check first activity
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Activity 1')).toBeInTheDocument();
      expect(screen.getByText('Lecture')).toBeInTheDocument();
      expect(screen.getByText('Room 101')).toBeInTheDocument();
      expect(screen.getByText('01:30')).toBeInTheDocument();
      
      // Check second activity
      expect(screen.getByText('Jane Smith, Bob Wilson')).toBeInTheDocument();
      expect(screen.getByText('Activity 2')).toBeInTheDocument();
      expect(screen.getByText('Workshop')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('02:00')).toBeInTheDocument();
    });

    it('should render N/A for empty staff array', () => {
      const weekWithNoStaff: WeekInfo = {
        weekNumber: 1,
        data: [{
          ...mockWeekInfo.data[0],
          staff: []
        }]
      };
      render(<WeekActivityTab week={weekWithNoStaff} />);
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should render CustomBadge components for type and status', () => {
      render(<WeekActivityTab week={mockWeekInfo} />);
      const badges = screen.getAllByTestId('custom-badge');
      expect(badges.length).toBe(4); // 2 activities * (1 type + 1 status)
    });
  });

  describe('Sorting Functionality', () => {
    const mockOnSort = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle sorting by staff', () => {
      render(
        <WeekActivityTab
          week={mockWeekInfo}
          onSort={mockOnSort}
        />
      );
      
      const staffHeader = screen.getByText('Staff Responsible');
      fireEvent.click(staffHeader);
      
      expect(mockOnSort).toHaveBeenCalledWith('staff', 'asc');
    });

    it('should toggle sort direction on second click', () => {
      render(
        <WeekActivityTab
          week={mockWeekInfo}
          sortConfig={{ key: 'staff', direction: 'asc' }}
          onSort={mockOnSort}
        />
      );
      
      const staffHeader = screen.getByText('Staff Responsible');
      fireEvent.click(staffHeader);
      
      expect(mockOnSort).toHaveBeenCalledWith('staff', 'desc');
    });

    it('should show sort indicators', () => {
      render(
        <WeekActivityTab
          week={mockWeekInfo}
          sortConfig={{ key: 'staff', direction: 'asc' }}
        />
      );
      
      expect(screen.getByText('↑')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    const mockEditActivity = jest.fn();
    const mockDeleteActivity = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render edit and delete buttons when callbacks provided', () => {
      render(
        <WeekActivityTab
          week={mockWeekInfo}
          originalActivities={mockOriginalActivities}
          onEditActivity={mockEditActivity}
          onDeleteActivity={mockDeleteActivity}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: /edit activity/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete activity/i });
      
      expect(editButtons.length).toBe(2);
      expect(deleteButtons.length).toBe(2);
    });

    it('should call edit callback with correct parameters', () => {
      render(
        <WeekActivityTab
          week={mockWeekInfo}
          originalActivities={mockOriginalActivities}
          onEditActivity={mockEditActivity}
          onDeleteActivity={mockDeleteActivity}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: /edit activity/i });
      fireEvent.click(editButtons[0]);
      
      expect(mockEditActivity).toHaveBeenCalledWith(
        mockOriginalActivities[0],
        0,
        mockWeekInfo.weekNumber
      );
    });

    it('should call delete callback with correct parameters', () => {
      render(
        <WeekActivityTab
          week={mockWeekInfo}
          originalActivities={mockOriginalActivities}
          onEditActivity={mockEditActivity}
          onDeleteActivity={mockDeleteActivity}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete activity/i });
      fireEvent.click(deleteButtons[1]);
      
      expect(mockDeleteActivity).toHaveBeenCalledWith(1, mockWeekInfo.weekNumber);
    });

    it('should not render action buttons when callbacks not provided', () => {
      render(<WeekActivityTab week={mockWeekInfo} />);
      
      expect(screen.queryByRole('button', { name: /edit activity/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete activity/i })).not.toBeInTheDocument();
    });
  });
});
