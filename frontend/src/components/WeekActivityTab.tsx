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
import { WeekInfo, WeekData, Activity } from '../utils/workbookUtils';
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
}

const WeekActivityTab: React.FC<WeekActivityTabProps> = ({
  week,
  originalActivities,
  onEditActivity,
  onDeleteActivity,
}) => {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Week {week.weekNumber} Activities</h2>
      </div>
      <div className="overflow-x-auto">
        <Table striped>
          <Table.Head>
            <Table.HeadCell>Staff Responsible</Table.HeadCell>
            <Table.HeadCell>Title / Name</Table.HeadCell>
            <Table.HeadCell>Learning Activity</Table.HeadCell>
            <Table.HeadCell>Learning Type</Table.HeadCell>
            <Table.HeadCell>Activity Location</Table.HeadCell>
            <Table.HeadCell>Task Status</Table.HeadCell>
            <Table.HeadCell>Time</Table.HeadCell>
            {(onEditActivity || onDeleteActivity) && <Table.HeadCell>Actions</Table.HeadCell>}
          </Table.Head>
          <Table.Body>
            {week.data.map((row: WeekData, index: number) => (
              <Table.Row key={index}>
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
                              onEditActivity(originalActivities[index], index, week.weekNumber)
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
                            onClick={() => onDeleteActivity(index, week.weekNumber)}
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
