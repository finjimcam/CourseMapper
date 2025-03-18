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

// src/components/WeekActivityTab.tsx
import React from 'react';
import { Table, Button, Tooltip } from 'flowbite-react';
import { CustomBadge } from './CustomBadge';
import { learningTypeColors, statusColors } from '../utils/colorMappings';
import { WeekInfo, Activity } from '../utils/workbookUtils';
import { HiPencil, HiTrash } from 'react-icons/hi';

interface WeekActivityTabProps {
  week: WeekInfo;
  /** (Optional) The original Activity objects corresponding to each row */
  originalActivities?: Activity[];
  /** (Optional) Callback when the user wants to edit an activity.
   * Receives (activity, activityIndex, weekNumber)
   */
  onEditActivity?: (activity: Activity, activityIndex: number, weekNumber: number) => void;
  /** (Optional) Callback when the user wants to delete an activity.
   * Receives (activityIndex, weekNumber)
   */
  onDeleteActivity?: (activityIndex: number, weekNumber: number) => void;
  /** (Optional) Current sort configuration */
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  /** (Optional) Callback for when sort changes */
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

const WeekActivityTab: React.FC<WeekActivityTabProps> = ({
  week,
  originalActivities,
  onEditActivity,
  onDeleteActivity,
  sortConfig,
  onSort,
}) => {
  // Local sort state
  const [localSortConfig, setLocalSortConfig] = React.useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Get effective sort config (prop or local)
  const effectiveSortConfig = sortConfig || localSortConfig;

  // Create data with original indices
  const dataWithIndices = React.useMemo(() => 
    week.data.map((item, index) => ({
      ...item,
      originalIndex: index
    })),
    [week.data]
  );

  // Sort the data if needed
  const sortedData = React.useMemo(() => {
    if (!effectiveSortConfig) return dataWithIndices;

    return [...dataWithIndices].sort((a, b) => {
      const { key, direction } = effectiveSortConfig;
      let result = 0;

      switch (key) {
        case 'staff': {
          // Sort by first staff member's name, or 'N/A' if no staff
          const aStaff = a.staff.length > 0 ? a.staff[0] : 'N/A';
          const bStaff = b.staff.length > 0 ? b.staff[0] : 'N/A';
          result = aStaff.localeCompare(bStaff);
          break;
        }
        case 'activity':
          result = a.activity.localeCompare(b.activity);
          break;
        case 'type':
          result = a.type.localeCompare(b.type);
          break;
        case 'status':
          result = a.status.localeCompare(b.status);
          break;
        default:
          result = 0;
      }
      
      return direction === 'asc' ? result : -result;
    });
  }, [dataWithIndices, effectiveSortConfig]);

  // Handle sort click
  const handleSort = (key: string) => {
    const direction: 'asc' | 'desc' = 
      effectiveSortConfig?.key === key && effectiveSortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc';
    
    const newConfig = { key, direction };
    if (onSort) {
      onSort(key, direction);
    } else {
      setLocalSortConfig(newConfig);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Week {week.weekNumber} Activities</h2>
      </div>
      <div className="overflow-x-auto">
        <Table striped>
          <Table.Head>
            <Table.HeadCell 
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('staff')}
            >
              Staff Responsible {effectiveSortConfig?.key === 'staff' && (
                <span className="ml-1">
                  {effectiveSortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </Table.HeadCell>
            <Table.HeadCell>Title / Name</Table.HeadCell>
            <Table.HeadCell 
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('activity')}
            >
              Learning Activity {effectiveSortConfig?.key === 'activity' && (
                <span className="ml-1">
                  {effectiveSortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </Table.HeadCell>
            <Table.HeadCell 
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('type')}
            >
              Learning Type {effectiveSortConfig?.key === 'type' && (
                <span className="ml-1">
                  {effectiveSortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </Table.HeadCell>
            <Table.HeadCell>Activity Location</Table.HeadCell>
            <Table.HeadCell 
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              Task Status {effectiveSortConfig?.key === 'status' && (
                <span className="ml-1">
                  {effectiveSortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </Table.HeadCell>
            <Table.HeadCell>Time</Table.HeadCell>
            {(onEditActivity || onDeleteActivity) && <Table.HeadCell>Actions</Table.HeadCell>}
          </Table.Head>
          <Table.Body>
          {sortedData.map((row) => (
              <Table.Row key={row.originalIndex}>
                <Table.Cell>{row.staff.length > 0 ? row.staff.join(', ') : 'N/A'}</Table.Cell>
                <Table.Cell>{row.title}</Table.Cell>
                <Table.Cell>{row.activity}</Table.Cell>
                <Table.Cell>
                  <CustomBadge label={row.type} colorMapping={learningTypeColors} />
                </Table.Cell>
                <Table.Cell>{row.location}</Table.Cell>
                <Table.Cell>
                  <CustomBadge label={row.status} colorMapping={statusColors} />
                </Table.Cell>
                <Table.Cell>{row.time}</Table.Cell>
                {(onEditActivity || onDeleteActivity) && (
                  <Table.Cell>
                    <div className="flex gap-2">
                      {onEditActivity && originalActivities && (
                        <Tooltip content="Edit Activity">
                          <Button
                            size="xs"
                            color="light"
                            onClick={() =>
                              onEditActivity(originalActivities[row.originalIndex], row.originalIndex, week.weekNumber)
                            }
                          >
                            <HiPencil className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      )}
                      {onDeleteActivity && (
                        <Tooltip content="Delete Activity">
                          <Button
                            size="xs"
                            color="light"
                            onClick={() => onDeleteActivity(row.originalIndex, week.weekNumber)}
                          >
                            <HiTrash className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </Table.Cell>
                )}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  );
};

export default WeekActivityTab;
