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

// src/components/WeeksTabs.tsx
import React from 'react';
import { Tabs, Button, Tooltip } from 'flowbite-react';
import { HiTrash } from 'react-icons/hi';
import WeekActivityTab from './WeekActivityTab';
import { Activity, Week, WeekInfo } from '../utils/workbookUtils';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface WeeksTabsProps {
  weeks: Week[];
  convertWeekToWeekInfo: (week: Week) => WeekInfo;
  onDeleteWeek: (weekNumber: number) => void;
  onAddActivity: (weekNumber: number) => void;
  onEditActivity: (activity: Activity, index: number, weekNumber: number) => void;
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
  // Maintain sort config for each week
  const [weekSortConfigs, setWeekSortConfigs] = React.useState<{
    [weekNumber: number]: SortConfig;
  }>({});

  const handleSort = (weekNumber: number, key: string, direction: 'asc' | 'desc') => {
    setWeekSortConfigs((prev) => ({
      ...prev,
      [weekNumber]: { key, direction },
    }));
  };

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
                return weekInfo;
              })()}
              originalActivities={week.activities}
              onEditActivity={onEditActivity}
              onDeleteActivity={onDeleteActivity}
              sortConfig={weekSortConfigs[week.number]}
              onSort={(key, direction) => handleSort(week.number, key, direction)}
            />
          </div>
        </Tabs.Item>
      ))}
    </Tabs>
  );
};

export default WeeksTabs;
