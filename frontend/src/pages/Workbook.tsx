// src/components/pages/workbook.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Tabs, Spinner } from 'flowbite-react';
import CourseHeader from '../components/CourseDetailsHeader';
import DashboardTab from '../components/DashboardTab';
import WeekActivityTab from '../components/WeekActivityTab';
import {
  Workbook,
  WorkbookDetailsResponse,
  WeekInfo,
  processActivitiesData,
  prepareDashboardData,
} from '../utils/workbookUtils';

function WorkbookPage(): JSX.Element {
  const { workbook_id } = useParams<{ workbook_id: string }>();

  const [workbookData, setWorkbookData] = useState<Workbook | null>(null);
  //const [courseLeadData, setCourseLeadData] = useState<User | null>(null);
  //const [learningPlatformData, setLearningPlatformData] = useState<LearningPlatform | null>(null);
  const [weeksData, setWeeksData] = useState<WeekInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState<boolean>(false);

  useEffect(() => {
    const fetchWorkbookData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<WorkbookDetailsResponse>(
          `${import.meta.env.VITE_API}/workbooks/${workbook_id}/details`
        );
        const { workbook, course_lead, learning_platform, activities } = response.data;
        if (course_lead && learning_platform) {
          setWorkbookData({workbook: workbook, 
              course_lead: course_lead,
              learning_platform: learning_platform
          });
        }
        //setCourseLeadData(course_lead);
        //setLearningPlatformData(learning_platform);
        if (activities.length > 0) {
          const weeksDataArray = processActivitiesData(activities);
          setWeeksData(weeksDataArray);
        }
        setLoading(false);
      } catch (err) {
        const errorObj = err as Error;
        console.error('Error fetching workbook data:', errorObj);
        setError(errorObj.message || 'An error occurred while fetching workbook data');
        setLoading(false);
      }
    };

    if (workbook_id) {
      fetchWorkbookData();
    }
  }, [workbook_id]);

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

  const dashboardData = prepareDashboardData(weeksData);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <CourseHeader
          workbook={workbookData}
        />
        <div className="flex justify-end mb-4">
          <Link
            to={`/workbook/edit/${workbook_id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Edit Workbook
          </Link>
        </div>
        <Tabs aria-label="Workbook Tabs">
          <Tabs.Item title="Dashboard">
            <DashboardTab
              series={dashboardData.series}
              options={dashboardData.options}
              summaryData={dashboardData.summaryData}
              allLearningTypes={dashboardData.allLearningTypes}
              showTable={showTable}
              toggleShowTable={() => setShowTable(!showTable)}
            />
          </Tabs.Item>
          {weeksData.map((week) => (
            <Tabs.Item key={week.weekNumber} title={`Week ${week.weekNumber}`}>
              <WeekActivityTab week={week} />
            </Tabs.Item>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

export default WorkbookPage;
