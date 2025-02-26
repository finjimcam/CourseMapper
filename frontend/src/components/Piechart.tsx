import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import axios from 'axios';
import { graduateAttributeColors } from './CustomBadge';
import { FONT_SIZE, getErrorMessage } from '../utils/workbookUtils';

interface WeekGraduateAttribute {
  week_workbook_id: string;
  week_number: number;
  graduate_attribute_id: string;
}

interface GraduateAttribute {
  id: string;
  name: string;
}

interface PieChartProps {
  workbook_id: string;
}

const PieChart: React.FC<PieChartProps> = ({ workbook_id }) => {
  const [chartData, setChartData] = useState<{ series: number[]; labels: string[] }>({
    series: [],
    labels: [],
  });
  const [chartColors, setChartColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('PieChart - Fetching data for workbook_id:', workbook_id);

        // Get all graduate attributes to show in chart (even if not used)
        const gradRes = await axios.get(`${import.meta.env.VITE_API}/graduate_attributes/`);
        const gradData: GraduateAttribute[] = gradRes.data;
        console.log('PieChart - All graduate attributes:', gradData);

        // Get graduate attributes for this workbook from all weeks
        const url = `${import.meta.env.VITE_API}/week-graduate-attributes/?week_workbook_id=${workbook_id}`;
        console.log('PieChart - Fetching workbook attributes from:', url);
        const gradSelRes = await axios.get(url);
        console.log('PieChart - Workbook graduate attributes response:', gradSelRes.data);
        const gradSelData: WeekGraduateAttribute[] = gradSelRes.data;

        // Count occurrences of each graduate attribute
        const attributeCounts: { [key: string]: number } = {};
        gradSelData.forEach((item) => {
          attributeCounts[item.graduate_attribute_id] =
            (attributeCounts[item.graduate_attribute_id] || 0) + 1;
        });

        // Track which attributes are used and separate them
        const attributeUsage: { [key: string]: boolean } = {};
        const usedAttributes: string[] = [];
        const unusedAttributes: string[] = [];

        gradData.forEach((attr) => {
          const count = attributeCounts[attr.id] || 0;
          attributeUsage[attr.name.toLowerCase()] = count > 0;
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

        // Create colors array in the same order
        const colors = allLabels.map((label) => {
          const normalizedKey = label.toLowerCase();
          return attributeUsage[normalizedKey]
            ? graduateAttributeColors[normalizedKey] || '#6c757d'
            : '#d4d4d4';
        });

        setChartData({ series, labels: allLabels });
        setChartColors(colors);
        setLoading(false);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    };

    fetchData();
  }, [workbook_id]);

  const chartOptions: { series: number[]; options: ApexOptions } = {
    series: chartData.series,
    options: {
      chart: {
        width: 600,
        height: 600,
        type: 'pie',
      },
      title: {
        text: 'Graduate Attributes Distribution',
        align: 'center',
        style: {
          fontSize: FONT_SIZE,
        },
      },
      labels: chartData.labels,
      colors: chartColors,
      legend: {
        position: 'right',
        height: 600,
        fontSize: FONT_SIZE,
        // eslint-disable-next-line
        formatter: function (seriesName: string, opts?: any) {
          const value = opts.w.globals.series[opts.seriesIndex];
          return value > 0
            ? `${seriesName}: ${value}`
            : `<span style="color: #999">${seriesName}</span>`;
        },
      },
      dataLabels: {
        enabled: false,
        formatter: function () {
          return '';
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 600,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    },
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <div id="chart">
        <ReactApexChart
          options={chartOptions.options}
          series={chartOptions.series}
          type="pie"
          width={600}
        />
      </div>
    </div>
  );
};

export default PieChart;
