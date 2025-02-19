// src/components/WeekActivityTab.tsx
import React from 'react';
import { Table, Button, Tooltip } from 'flowbite-react';
import { CustomBadge, learningTypeColors, statusColors } from './CustomBadge';
import { WeekInfo, WeekData } from '../utils/workbookUtils';
import { HiPencil, HiTrash } from 'react-icons/hi';

interface WeekActivityTabProps {
  week: WeekInfo;
  /** (Optional) The original Activity objects corresponding to each row */
  originalActivities?: any[];
  /** (Optional) Callback when the user wants to edit an activity.
   * Receives (activity, activityIndex, weekNumber)
   */
  onEditActivity?: (activity: any, activityIndex: number, weekNumber: number) => void;
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
  console.log('WeekActivityTab props:', {
    weekNumber: week.weekNumber,
    workbookId: week.workbookId,
    week
  });

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
                          onClick={() => onEditActivity(originalActivities[index], index, week.weekNumber)}
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
