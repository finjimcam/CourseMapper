import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface WeekGraduateAttribute {
  week_workbook_id: string;
  week_number: number;
  graduate_attribute_id: string;
}

interface GraduateAttribute {
  id: string;
  name: string;
}

const PieChart: React.FC = () => {
  const [chartData, setChartData] = useState<{ series: number[]; labels: string[] }>({
    series: [],
    labels: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch selections and graduate attributes concurrently
        const [gradSelRes, gradRes] = await Promise.all([
          fetch('http://localhost:8000/week-graduate-attributes/'),
          fetch('http://localhost:8000/graduate_attributes/')
        ]);

        if (!gradSelRes.ok || !gradRes.ok) {
          throw new Error(`HTTP error! status: ${gradSelRes.status} or ${gradRes.status}`);
        }

        const gradSelData: WeekGraduateAttribute[] = await gradSelRes.json();
        const gradData: GraduateAttribute[] = await gradRes.json();

        // Create a lookup map for attribute names
        const attributeMap: Record<string, string> = {};
        gradData.forEach((attr) => {
          attributeMap[attr.id] = attr.name;
        });

        // Aggregate counts for each graduate attribute (each occurrence counts as 1)
        const counts: Record<string, number> = {};
        gradSelData.forEach((item) => {
          counts[item.graduate_attribute_id] = (counts[item.graduate_attribute_id] || 0) + 1;
        });

        // Prepare labels and series arrays
        // Each slice represents a graduate attribute; label is its name (or fallback to its id)
        const labels = Object.keys(counts).map((id) => attributeMap[id] || id);
        const series = Object.keys(counts).map((id) => counts[id]);

        setChartData({ series, labels });
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartOptions: { series: number[]; options: ApexOptions } = {
    series: chartData.series,
    options: {
      chart: {
        width: 380,
        type: 'pie'
      },
      labels: chartData.labels,
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ]
    }
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
          width={380}
        />
      </div>
    </div>
  );
};

export default PieChart;
