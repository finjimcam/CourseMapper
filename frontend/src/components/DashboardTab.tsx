// src/components/DashboardTab.tsx
import React from 'react';
import { Table } from 'flowbite-react';
import ReactApexChart from 'react-apexcharts';
import { CustomBadge, learningTypeColors } from './CustomBadge';
import { ApexOptions } from 'apexcharts';

interface DashboardTabProps {
  series: ApexOptions['series'];
  options: ApexOptions;
  summaryData: { [key: string]: string }[];
  allLearningTypes: string[];
  showTable: boolean;
  toggleShowTable: () => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  series,
  options,
  summaryData,
  allLearningTypes,
  showTable,
  toggleShowTable,
}) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Weekly Notional Learning Hours</h2>
      <div className="mb-8">
        {showTable ? (
          <div className="overflow-x-auto">
            <Table striped>
              <Table.Head>
                <Table.HeadCell>
                  <CustomBadge label="Week" colorMapping={{ default: '#6c757d' }} />
                </Table.HeadCell>
                {allLearningTypes.map((type) => (
                  <Table.HeadCell key={type}>
                    <CustomBadge label={type} colorMapping={learningTypeColors} />
                  </Table.HeadCell>
                ))}
                <Table.HeadCell>
                  <CustomBadge label="Total Hours" colorMapping={{ default: '#6c757d' }} />
                </Table.HeadCell>
              </Table.Head>
              <Table.Body style={{ textAlign: 'center' }}>
                {summaryData.map((row, index) => (
                  <Table.Row key={index}>
                    <Table.Cell>{row.week}</Table.Cell>
                    {allLearningTypes.map((type) => (
                      <Table.Cell key={type}>{row[type.toLowerCase()]}</Table.Cell>
                    ))}
                    <Table.Cell className="font-bold">{row.total}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        ) : (
          <ReactApexChart options={options} series={series} type="bar" height={350} />
        )}
      </div>
      <button
        onClick={toggleShowTable}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        {showTable ? 'Show Graph' : 'Show Table'}
      </button>
    </div>
  );
};

export default DashboardTab;
