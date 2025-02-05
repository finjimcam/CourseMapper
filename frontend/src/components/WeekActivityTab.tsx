// src/components/WeekActivityTab.tsx
import React from 'react';
import { Table } from 'flowbite-react';
import { CustomBadge, learningTypeColors, statusColors } from './CustomBadge';
import { WeekInfo, WeekData } from '../utils/workbookUtils';

interface WeekActivityTabProps {
  week: WeekInfo;
}

const WeekActivityTab: React.FC<WeekActivityTabProps> = ({ week }) => (
  <div className="p-4">
    <h2 className="text-2xl font-bold mb-4">Week {week.weekNumber} Activities</h2>
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
        </Table.Head>
        <Table.Body>
          {week.data.map((row: WeekData, index: number) => (
            <Table.Row key={index}>
              <Table.Cell>
                {row.staff.length > 0 ? row.staff.join(', ') : 'N/A'}
              </Table.Cell>
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
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  </div>
);

export default WeekActivityTab;
