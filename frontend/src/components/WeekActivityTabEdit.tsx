// src/components/WeeksTabs.tsx
import React from 'react';
import { Tabs, Button, Tooltip } from 'flowbite-react';
import { HiTrash } from 'react-icons/hi';
import WeekActivityTab from './WeekActivityTab';
import { WeekInfo } from '../utils/workbookUtils';
import { Week } from '../pages/EditWorkbook';

interface WeeksTabsProps {
  weeks: Week[];
  convertWeekToWeekInfo: (week: Week) => WeekInfo;
  onDeleteWeek: (weekNumber: number) => void;
  onAddActivity: (weekNumber: number) => void;
  onEditActivity: (activity: any, index: number, weekNumber: number) => void;
  onDeleteActivity: (index: number, weekNumber: number) => void;
  onWeekChange?: (weekNumber: number) => void;
}

const WeeksTabs: React.FC<WeeksTabsProps> = ({
  weeks,
  convertWeekToWeekInfo,
  onDeleteWeek,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onWeekChange,
}) => {
  console.log('WeeksTabs - weeks:', weeks);
  
  return (
  <Tabs 
    aria-label="Workbook Tabs"
    onActiveTabChange={(tab) => {
      const weekNumber = weeks[tab].number;
      onWeekChange?.(weekNumber);
    }}
  >
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
            week={(() => {
              const weekInfo = convertWeekToWeekInfo(week);
              console.log('WeeksTabs - converted week info:', {
                weekNumber: weekInfo.weekNumber,
                workbookId: weekInfo.workbookId,
                week
              });
              return weekInfo;
            })()}
            originalActivities={week.activities}
            onEditActivity={onEditActivity}
            onDeleteActivity={onDeleteActivity}
          />
        </div>
      </Tabs.Item>
    ))}
  </Tabs>
  );
};

export default WeeksTabs;
