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

// src/components/pages/workbook.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Tabs, Spinner } from 'flowbite-react';
import CourseHeader from '../components/CourseDetailsHeader';
import DashboardTab from '../components/DashboardTab';
import WeekActivityTab from '../components/WeekActivityTab';
import WeeklyAttributes from '../components/WeeklyAttributes';
import {
  Workbook,
  WorkbookDetailsResponse,
  WeekInfo,
  processActivitiesData,
  prepareDashboardData,
  canUserEdit,
  getContributors,
  User,
} from '../utils/workbookUtils';

function WorkbookPage(): JSX.Element {
  const { workbook_id } = useParams<{ workbook_id: string }>();

  const [workbookData, setWorkbookData] = useState<Workbook | null>(null);
  const [weeksData, setWeeksData] = useState<WeekInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [ifCourseLead, setIfCourseLead] = useState<boolean>(false);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [isDashboardTab, setIsDashboardTab] = useState<boolean>(true);
  const [contributors, setContributors] = useState<User[]>([]);

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
          setWorkbookData({
            workbook: workbook,
            course_lead: course_lead,
            learning_platform: learning_platform,
          });
        }

        // Ensure each activity has the workbook_id
        const activitiesWithWorkbookId = activities.map((activity) => ({
          ...activity,
          workbook_id: workbook.id,
        }));

        if (activitiesWithWorkbookId.length > 0) {
          const weeksDataArray = processActivitiesData(activitiesWithWorkbookId);
          setWeeksData(weeksDataArray);
        }

        setIfCourseLead(await canUserEdit(workbook.id));
        setContributors(await getContributors(workbook.id));

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
        <div className="flex justify-between items-start mb-4">
          <CourseHeader workbook={workbookData} contributors={contributors} />

          <div className="flex flex-col justify-between items-end gap-2">
            {ifCourseLead ? (
              <Link
                to={`/workbook/edit/${workbook_id}`}
                className="px-5 py-2.5 text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm text-center"
              >
                Edit Workbook
              </Link>
            ) : null}
            {!isDashboardTab && (
              <WeeklyAttributes weekNumber={selectedWeek} workbookId={workbook_id} />
            )}
          </div>
        </div>
        <Tabs
          aria-label="Workbook Tabs"
          onActiveTabChange={(tab) => {
            const isOnDashboard = tab === 0;
            setIsDashboardTab(isOnDashboard);
            if (!isOnDashboard) {
              setSelectedWeek(tab);
            }
          }}
        >
          <Tabs.Item title="Dashboard">
            <DashboardTab
              series={dashboardData.series}
              options={dashboardData.options}
              summaryData={dashboardData.summaryData}
              allLearningTypes={dashboardData.allLearningTypes}
              showTable={showTable}
              toggleShowTable={() => setShowTable(!showTable)}
              workbook_id={workbook_id || ''}
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
