// src/components/WeeksTabs.tsx
import React from 'react';
import { Tabs, Button, Tooltip } from 'flowbite-react';
import { HiTrash } from 'react-icons/hi';
import WeekActivityTab from './WeekActivityTab';
import { Week, WeekInfo } from '../utils/workbookUtils';

interface WeeksTabsProps {
  weeks: Week[];
  convertWeekToWeekInfo: (week: Week) => WeekInfo;
  onDeleteWeek: (weekNumber: number) => void;
  onAddActivity: (weekNumber: number) => void;
  onEditActivity: (activity: any, index: number, weekNumber: number) => void;
  onDeleteActivity: (index: number, weekNumber: number) => void;
}

const WeeksTabs: React.FC<WeeksTabsProps> = ({
  weeks,
  convertWeekToWeekInfo,
  onDeleteWeek,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
}) => (
  <Tabs aria-label="Workbook Tabs">
    {weeks.map((week) => (
      <Tabs.Item key={week.number} title={`Week ${week.number}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Week {week.number} Activities</h2>
              <Tooltip content="Delete Week">
                <Button size="xs" color="light" onClick={() => onDeleteWeek(week.number)}>
                  <HiTrash className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
            <Button onClick={() => onAddActivity(week.number)}>Add Activity</Button>
          </div>
          <WeekActivityTab
            week={convertWeekToWeekInfo(week)}
            originalActivities={week.activities}
            onEditActivity={onEditActivity}
            onDeleteActivity={onDeleteActivity}
          />
        </div>
      </Tabs.Item>
    ))}
  </Tabs>
);

export default WeeksTabs;
