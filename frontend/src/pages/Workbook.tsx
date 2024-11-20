// Workbook.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Tabs, Table, Badge, Spinner } from 'flowbite-react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// Backend data interfaces
interface User {
  id: string;
  name: string;
}

interface Course {
  id: string;
  course_code: string;
  name: string;
}

interface LearningPlatform {
  id: string;
  name: string;
}

interface LearningActivity {
  id: string;
  name: string;
  learning_platform_id: string;
}

interface LearningType {
  id: string;
  name: string;
}

interface TaskStatus {
  id: string;
  name: string;
}

interface WorkbookData {
  id: string;
  start_date: string;
  end_date: string;
  course_id: string;
  course_lead_id: string;
  learning_platform_id: string;
}

interface ActivityData {
  id: string;
  name: string;
  time_estimate_minutes: number;
  location: string;
  week_number: number;
  workbook_id: string;
  learning_activity_id: string;
  learning_type_id: string;
  task_status_id: string;
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

function Workbook(): JSX.Element {
  // Get the workbook_id from the URL parameters
  const { workbook_id } = useParams<{ workbook_id: string }>();

  // State variables
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [courseLeadData, setCourseLeadData] = useState<User | null>(null);
  const [learningPlatformData, setLearningPlatformData] = useState<LearningPlatform | null>(null);
  const [activitiesData, setActivitiesData] = useState<ActivityData[]>([]);
  const [learningActivities, setLearningActivities] = useState<{ [key: string]: LearningActivity }>({});
  const [learningTypes, setLearningTypes] = useState<{ [key: string]: LearningType }>({});
  const [taskStatuses, setTaskStatuses] = useState<{ [key: string]: TaskStatus }>({});
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

        // Fetch workbook details
        const workbookResponse = await axios.get('http://127.0.0.1:8000/workbooks/', {
          params: { workbook_id },
        });
        
        if (!workbookResponse.data || workbookResponse.data.length === 0) {
          throw new Error('Workbook not found');
        }

        const workbook = workbookResponse.data[0];
        setWorkbookData(workbook);

        // Fetch course data
        const courseResponse = await axios.get('http://127.0.0.1:8000/courses/');
        const course = courseResponse.data.find((c: Course) => c.id === workbook.course_id);
        setCourseData(course || null);

        // Fetch user data for course lead
        const usersResponse = await axios.get('http://127.0.0.1:8000/users/');
        const courseLead = usersResponse.data.find((u: User) => u.id === workbook.course_lead_id);
        setCourseLeadData(courseLead || null);

        // Fetch learning platform data
        const platformResponse = await axios.get('http://127.0.0.1:8000/learning-platforms/');
        const platform = platformResponse.data.find((p: LearningPlatform) => p.id === workbook.learning_platform_id);
        setLearningPlatformData(platform || null);

        // Fetch all learning activities
        const learningActivitiesResponse = await axios.get('http://127.0.0.1:8000/learning-activities/');
        const activitiesMap = learningActivitiesResponse.data.reduce((acc: any, curr: LearningActivity) => {
          acc[curr.id] = curr;
          return acc;
        }, {});
        setLearningActivities(activitiesMap);

        // Fetch all learning types
        const learningTypesResponse = await axios.get('http://127.0.0.1:8000/learning-types/');
        const typesMap = learningTypesResponse.data.reduce((acc: any, curr: LearningType) => {
          acc[curr.id] = curr;
          return acc;
        }, {});
        setLearningTypes(typesMap);

        // Fetch all task statuses
        const taskStatusesResponse = await axios.get('http://127.0.0.1:8000/task-statuses/');
        const statusesMap = taskStatusesResponse.data.reduce((acc: any, curr: TaskStatus) => {
          acc[curr.id] = curr;
          return acc;
        }, {});
        setTaskStatuses(statusesMap);

        // Fetch activities associated with the workbook
        const activitiesResponse = await axios.get('http://127.0.0.1:8000/activities/', {
          params: { workbook_id },
        });
        
        const activities = activitiesResponse.data || [];
        setActivitiesData(activities);

        // Process activities data into weeksData
        if (activities.length > 0) {
          const weeksDataArray = processActivitiesData(activities, activitiesMap, typesMap, statusesMap);
          setWeeksData(weeksDataArray);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching workbook data:', err);
        setError(err.message || 'An error occurred while fetching workbook data');
        setLoading(false);
      }
    };

    if (workbook_id) {
      fetchWorkbookData();
    }
  }, [workbook_id]);

  // Function to process activities data into weeksData
  const processActivitiesData = (
    activities: ActivityData[],
    learningActivitiesMap: { [key: string]: LearningActivity },
    learningTypesMap: { [key: string]: LearningType },
    taskStatusesMap: { [key: string]: TaskStatus }
  ) => {
    const weeksMap: { [key: number]: { weekNumber: number; data: WeekData[] } } = {};

    activities.forEach((activity) => {
      const weekNumber = activity.week_number || 1;
      if (!weeksMap[weekNumber]) {
        weeksMap[weekNumber] = {
          weekNumber,
          data: [],
        };
      }

      weeksMap[weekNumber].data.push({
        staff: [], // Currently not populated in backend
        title: activity.name || 'Untitled',
        activity: learningActivitiesMap[activity.learning_activity_id]?.name || 'N/A',
        type: learningTypesMap[activity.learning_type_id]?.name || 'N/A',
        time: activity.time_estimate_minutes
          ? formatMinutes(activity.time_estimate_minutes)
          : '00:00',
        status: taskStatusesMap[activity.task_status_id]?.name || 'Unassigned',
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
      const type = activity.type;
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

  // Get all unique learning types
  const learningTypesSet = new Set<string>();
  weekTotals.forEach((week) => {
    Object.keys(week.totals).forEach((type) => learningTypesSet.add(type));
  });
  const learningTypesList = Array.from(learningTypesSet);

  // Prepare series data for the chart
  const series = learningTypesList.map((type) => ({
    name: type,
    data: weekTotals.map((week) => week.totals[type] || 0),
  }));

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
        columnWidth: '60%',
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
    },
    colors: ['#a1f5ed', '#ffd21a', '#7aaeea', '#f8807f', '#bb98dc', '#bdea75', '#44546a'],
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

  // Prepare data for the summary table
  const summaryData = weekTotals.map((week) => {
    const row: { [key: string]: string } = {
      week: `Week ${week.weekNumber}`,
      total: formatMinutes(week.totalMinutes),
    };
    learningTypesList.forEach((type) => {
      row[type.toLowerCase()] = formatMinutes(week.totals[type] || 0);
    });
    return row;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow">
        {/* Course Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {courseData?.name || 'Course Title'}
          </h1>
          <p className="text-lg text-gray-600">
            Course Lead:{' '}
            {courseLeadData?.name || <span className="text-gray-500">N/A</span>}
          </p>
          <p className="text-lg text-gray-600">
            Learning Platform:{' '}
            {learningPlatformData?.name || <span className="text-gray-500">N/A</span>}
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
                        <Table.HeadCell>Week</Table.HeadCell>
                        {learningTypesList.map((type) => (
                          <Table.HeadCell key={type}>{type}</Table.HeadCell>
                        ))}
                        <Table.HeadCell>Total Hours</Table.HeadCell>
                      </Table.Head>
                      <Table.Body>
                        {summaryData.map((row, index) => (
                          <Table.Row key={index}>
                            <Table.Cell>{row.week}</Table.Cell>
                            {learningTypesList.map((type) => (
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
                      <Table.HeadCell>Time</Table.HeadCell>
                      <Table.HeadCell>Task Status</Table.HeadCell>
                      <Table.HeadCell>Activity Location</Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                      {week.data.map((row: WeekData, index: number) => (
                        <Table.Row key={index}>
                          <Table.Cell>{row.staff.length > 0 ? row.staff.join(', ') : 'N/A'}</Table.Cell>
                          <Table.Cell>{row.title}</Table.Cell>
                          <Table.Cell>{row.activity}</Table.Cell>
                          <Table.Cell>{row.type}</Table.Cell>
                          <Table.Cell>{row.time}</Table.Cell>
                          <Table.Cell>
                            <Badge color="success">{row.status}</Badge>
                          </Table.Cell>
                          <Table.Cell>{row.location}</Table.Cell>
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
