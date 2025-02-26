// src/components/DashboardTab.tsx
import React, { useState, useEffect } from 'react';
import { Table } from 'flowbite-react';
import ReactApexChart from 'react-apexcharts';
import { CustomBadge, learningTypeColors, graduateAttributeColors } from './CustomBadge';
import GraduateAttributesChart from './GraduateAttributesChart';
import axios from 'axios';
import { normalizeKey } from '../utils/stringUtils';
import { ApexOptions } from 'apexcharts';
import { getErrorMessage } from '../utils/workbookUtils';

interface DashboardTabProps {
  series: ApexOptions['series'];
  options: ApexOptions;
  summaryData: { [key: string]: string }[];
  allLearningTypes: string[];
  showTable: boolean;
  toggleShowTable: () => void;
  workbook_id: string;
  attributesRefreshTrigger?: number;
}

interface WeekGraduateAttribute {
  week_workbook_id: string;
  week_number: number;
  graduate_attribute_id: string;
}

interface GraduateAttribute {
  id: string;
  name: string;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  series,
  options,
  summaryData,
  allLearningTypes,
  showTable,
  toggleShowTable,
  workbook_id,
  attributesRefreshTrigger,
}) => {
  const [showAttributesTable, setShowAttributesTable] = useState(false);
  const [attributesData, setAttributesData] = useState<{
    labels: string[];
    series: number[];
    colors: string[];
  }>({ labels: [], series: [], colors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttributesData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all graduate attributes
        const gradRes = await axios.get<GraduateAttribute[]>(
          `${import.meta.env.VITE_API}/graduate_attributes/`
        );
        const gradData = gradRes.data;

        // Get graduate attributes for this specific workbook
        const gradSelRes = await axios.get<WeekGraduateAttribute[]>(
          `${import.meta.env.VITE_API}/workbooks/${workbook_id}/week-graduate-attributes`
        );
        const gradSelData = gradSelRes.data;

        // Count occurrences of each graduate attribute
        const attributeCounts: { [key: string]: number } = {};
        gradSelData.forEach((item) => {
          attributeCounts[item.graduate_attribute_id] =
            (attributeCounts[item.graduate_attribute_id] || 0) + 1;
        });

        // Track which attributes are used
        const attributeUsage: { [key: string]: boolean } = {};
        const usedAttributes: string[] = [];
        const unusedAttributes: string[] = [];

        gradData.forEach((attr) => {
          const count = attributeCounts[attr.id] || 0;
          const normalizedKey = normalizeKey(attr.name);
          attributeUsage[normalizedKey] = count > 0;

          if (count > 0) {
            usedAttributes.push(attr.name);
          } else {
            unusedAttributes.push(attr.name);
          }
        });

        // Combine labels with used attributes first
        const allLabels = [...usedAttributes, ...unusedAttributes];

        // Create series data in the same order
        const series = allLabels.map((label) => {
          const attrId = gradData.find((attr) => attr.name === label)?.id;
          return attrId ? attributeCounts[attrId] || 0 : 0;
        });

        // Create colors array
        const colors = allLabels.map((label) => {
          const normalizedKey = normalizeKey(label);
          const isUsed = attributeUsage[normalizedKey];
          const baseColor = graduateAttributeColors[normalizedKey] || '#6c757d';

          if (isUsed) {
            return baseColor;
          } else {
            const r = parseInt(baseColor.slice(1, 3), 16);
            const g = parseInt(baseColor.slice(3, 5), 16);
            const b = parseInt(baseColor.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, 0.3)`;
          }
        });

        setAttributesData({ labels: allLabels, series, colors });
        setLoading(false);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    };

    fetchAttributesData();
  }, [workbook_id, attributesRefreshTrigger]);
  if (loading) {
    return <div>Loading graduate attributes data...</div>;
  }

  if (error) {
    return <div>Error loading graduate attributes: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Weekly Notional Learning Hours</h2>
          <div className="mb-4">
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
            <button
              onClick={toggleShowTable}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {showTable ? 'Show Graph' : 'Show Table'}
            </button>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Total Graduate Attributes</h2>
          <GraduateAttributesChart
            data={attributesData}
            showTable={showAttributesTable}
            toggleShowTable={() => setShowAttributesTable(!showAttributesTable)}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
