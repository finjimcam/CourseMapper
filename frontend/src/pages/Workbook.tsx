// Workbook.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Tabs, Table, Spinner } from 'flowbite-react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { statusColors, learningTypeColors, CustomBadge } from '../components/CustomBadge';

// Backend data interfaces
interface User {
  id: string;
  name: string;
}

interface LearningPlatform {
  id: string;
  name: string;
}

interface WorkbookData {
  id: string;
  start_date: string;
  end_date: string;
  course_name: string;
  course_lead_id: string;
  learning_platform_id: string;
}

interface ActivityData {
  id: string;
  name: string;
  time_estimate_minutes: number;
  location: string;
  week_number: number;
  learning_activity: string;
  learning_type: string;
  task_status: string;
  staff: User[]; // Added staff array
}

interface WeekData {
  staff: string[];
  title: string;
  activity: string;
  type: string;
  time: string;
  status: string;
  location: string;
}

interface WeekInfo {
  weekNumber: number;
  data: WeekData[];
}

interface WorkbookDetailsResponse {
  workbook: WorkbookData;
  course_lead: User | null;
  learning_platform: LearningPlatform | null;
  activities: ActivityData[];
}

function Workbook(): JSX.Element {
  // Get the workbook_id from the URL parameters
  const { workbook_id } = useParams<{ workbook_id: string }>();

  // State variables
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  const [courseLeadData, setCourseLeadData] = useState<User | null>(null);
  const [learningPlatformData, setLearningPlatformData] = useState<LearningPlatform | null>(null);
  const [weeksData, setWeeksData] = useState<WeekInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState<boolean>(false);

  // Fetch workbook data and activities data
  useEffect(() => {
    const fetchWorkbookData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all workbook-related data in one call
        const response = await axios.get<WorkbookDetailsResponse>(
          `${import.meta.env.VITE_API}/workbooks/${workbook_id}/details`
        );
        const { workbook, course_lead, learning_platform, activities } = response.data;

        setWorkbookData(workbook);
        setCourseLeadData(course_lead);
        setLearningPlatformData(learning_platform);

        // Process activities data into weeksData
        if (activities.length > 0) {
          const weeksDataArray = processActivitiesData(activities);
          setWeeksData(weeksDataArray);
        }

        setLoading(false);
      } catch (err) {
        const error = err as Error;
        console.error('Error fetching workbook data:', error);
        setError(error.message || 'An error occurred while fetching workbook data');
        setLoading(false);
      }
    };

    if (workbook_id) {
      fetchWorkbookData();
    }
  }, [workbook_id]);

  // Function to process activities data into weeksData
  const processActivitiesData = (activities: ActivityData[]) => {
    const weeksMap: { [key: number]: WeekInfo } = {};

    activities.forEach((activity) => {
      const weekNumber = activity.week_number || 1;
      if (!weeksMap[weekNumber]) {
        weeksMap[weekNumber] = {
          weekNumber,
          data: [],
        };
      }

      weeksMap[weekNumber].data.push({
        staff: activity.staff.map((user) => user.name),
        title: activity.name || 'Untitled',
        activity: activity.learning_activity || 'N/A',
        type: activity.learning_type || 'N/A',
        time: activity.time_estimate_minutes
          ? formatMinutes(activity.time_estimate_minutes)
          : '00:00',
        status: activity.task_status || 'Unassigned',
        location: activity.location || 'On Campus',
      });
    });

    return Object.values(weeksMap).sort((a, b) => a.weekNumber - b.weekNumber);
  };

  // Helper functions for time calculations
  const timeToMinutes = (time: string): number => {
    const [hoursStr, minutesStr] = time.split(':');
    const hours = parseInt(hoursStr) || 0;
    const minutes = parseInt(minutesStr) || 0;
    return hours * 60 + minutes;
  };

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const calculateLearningTypeMinutes = (weekData: WeekData[]): { [key: string]: number } => {
    const totals: { [key: string]: number } = {};

    weekData.forEach((activity) => {
      const minutes = timeToMinutes(activity.time);
      const type = activity.type.toLowerCase(); // Ensure lowercase for consistency
      if (totals[type]) {
        totals[type] += minutes;
      } else {
        totals[type] = minutes;
      }
    });

    return totals;
  };

  const calculateTotalMinutes = (weekData: WeekData[]): number => {
    return weekData.reduce((total, activity) => total + timeToMinutes(activity.time), 0);
  };

  // Handle loading and error states
  if (loading) {
    return (
      <div className="text-center mt-10">
        <Spinner aria-label="Loading" size="xl" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  }

  if (!workbookData) {
    return <div className="text-center mt-10">No workbook data available.</div>;
  }

  // Prepare data for the chart and table
  const weekTotals = weeksData.map((week) => {
    const totals = calculateLearningTypeMinutes(week.data);
    const totalMinutes = calculateTotalMinutes(week.data);
    return {
      weekNumber: week.weekNumber,
      totals,
      totalMinutes,
    };
  });

  // Find the maximum total minutes across all weeks
  const maxMinutes = Math.max(...weekTotals.map((week) => week.totalMinutes), 0);

  // Set the y-axis maximum dynamically, with a buffer
  const yAxisMax = Math.ceil(maxMinutes / 60) * 60 + 60; // Add an extra hour as buffer

  // Get all learning types from the color mapping
  const allLearningTypes = Object.keys(learningTypeColors).map((type) =>
    type.charAt(0).toUpperCase() + type.slice(1) // Capitalize first letter for display
  );

  // Prepare series data for the chart, including all types
  const series = allLearningTypes.map((type) => {
    const lowerType = type.toLowerCase(); // Convert to lowercase for data access
    return {
      name: type, // Keep capitalized for display in legend
      data: weekTotals.map((week) => week.totals[lowerType] || 0),
    };
  });

  // Chart configuration
  const options: ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '15%',
        borderRadius: 5,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: weekTotals.map((week) => `Week ${week.weekNumber}`),
      axisBorder: {
        show: true,
      },
      axisTicks: {
        show: true,
      },
    },
    yaxis: {
      title: {
        text: 'Hours',
      },
      min: 0,
      max: yAxisMax,
      tickAmount: yAxisMax / 60,
      labels: {
        formatter: (value: number) => {
          const hours = Math.floor(value / 60);
          const minutes = value % 60;
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        },
      },
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'left',
      formatter: (seriesName: string) => {
        const lowercaseSeriesName = seriesName.toLowerCase();
        const isUsed = weekTotals.some(
          (week) =>
            week.totals[lowercaseSeriesName] !== undefined &&
            week.totals[lowercaseSeriesName] > 0
        );
        return isUsed
          ? seriesName
          : `<span style="color: #999">${seriesName}</span>`;
      },
      markers: {
        width: 12,
        height: 12,
        strokeWidth: 0,
        fillColors: allLearningTypes.map((type) => {
          const lowercaseType = type.toLowerCase();
          const isUsed = weekTotals.some(
            (week) =>
              week.totals[lowercaseType] !== undefined &&
              week.totals[lowercaseType] > 0
          );
          return isUsed ? learningTypeColors[lowercaseType] : '#d4d4d4';
        }),
      },
    },
    colors: ['#a1f5ed', '#7aaeea', '#ffd21a', '#bb98dc', '#bdea75', '#f8807f', '#44546a'],
    fill: {
      opacity: 1,
    },
    grid: {
      show: true,
      borderColor: '#e0e0e0',
      strokeDashArray: 0,
      position: 'back',
    },
  };

  // Prepare data for the summary table, including all types
  const summaryData = weekTotals.map((week) => {
    const row: { [key: string]: string } = {
      week: `Week ${week.weekNumber}`,
      total: formatMinutes(week.totalMinutes),
    };
    allLearningTypes.forEach((type) => {
      row[type.toLowerCase()] = formatMinutes(week.totals[type.toLowerCase()] || 0);
    });
    return row;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow">
        {/* Course Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {workbookData?.course_name || 'Course Title'}
          </h1>
          <p className="text-lg text-gray-600">
            Course Lead:{' '}
            {courseLeadData?.name || <span className="text-gray-500">N/A</span>}
          </p>
          <p className="text-lg text-gray-600">
            Learning Platform:{' '}
            {learningPlatformData?.name || <span className="text-gray-500">N/A</span>}
          </p>
          <p className="text-lg text-gray-600">
            Start Date:{' '}
            {workbookData?.start_date
              ? new Date(workbookData.start_date).toLocaleDateString('en-UK')
              : <span className="text-gray-500">N/A</span>}
          </p>
          <p className="text-lg text-gray-600">
            End Date:{' '}
            {workbookData?.end_date
              ? new Date(workbookData.end_date).toLocaleDateString('en-UK')
              : <span className="text-gray-500">N/A</span>}
          </p>
        </div>

        {/* Tabs */}
        <Tabs aria-label="Workbook Tabs">
          <Tabs.Item title="Dashboard">
            {/* Dashboard Content */}
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
                onClick={() => setShowTable(!showTable)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                {showTable ? 'Show Graph' : 'Show Table'}
              </button>
            </div>
          </Tabs.Item>

          {weeksData.map((week) => (
            <Tabs.Item key={week.weekNumber} title={`Week ${week.weekNumber}`}>
              {/* Week Content */}
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
            </Tabs.Item>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

export default Workbook;
