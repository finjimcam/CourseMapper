// EditWorkbook.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Tabs, Spinner, Button } from 'flowbite-react';

interface WorkbookData {
  id: string;
  start_date: string;
  end_date: string;
  course_name: string;
  course_lead_id: string;
  learning_platform_id: string;
}

function EditWorkbook(): JSX.Element {
  const navigate = useNavigate();
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<boolean>(false);

  // Use the data from CreateWorkbookModal stored in sessionStorage
  useEffect(() => {
    const storedData = sessionStorage.getItem('newWorkbookData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setWorkbookData({
        id: 'temp',
        course_name: data.courseName,
        start_date: data.startDate,
        end_date: data.endDate,
        learning_platform_id: data.learningPlatformId,
        course_lead_id: 'temp' // Will be set by backend
      });
      setLoading(false);
    } else {
      setError('No workbook data found');
      setLoading(false);
    }
  }, []);

  const handlePublish = async () => {
    if (!workbookData) return;

    try {
      setPublishing(true);
      setError(null);

      // Create the workbook
      const response = await axios.post('http://127.0.0.1:8000/workbooks/', {
        course_name: workbookData.course_name,
        learning_platform_id: workbookData.learning_platform_id,
        start_date: new Date(workbookData.start_date).toISOString().split('T')[0],
        end_date: new Date(workbookData.end_date).toISOString().split('T')[0]
      });

      // Clear the temporary data
      sessionStorage.removeItem('newWorkbookData');

      // Navigate to the published workbook
      navigate(`/workbooks/${response.data.id}`);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to publish workbook');
      setPublishing(false);
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow">
        {/* Course Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              {workbookData.course_name}
            </h1>
            <Button
              gradientDuoTone="greenToBlue"
              size="lg"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : 'Publish Workbook'}
            </Button>
          </div>
          <p className="text-lg text-gray-600">
            Start Date: {new Date(workbookData.start_date).toLocaleDateString()}
          </p>
          <p className="text-lg text-gray-600">
            End Date: {new Date(workbookData.end_date).toLocaleDateString()}
          </p>
        </div>

        {/* Tabs */}
        <Tabs aria-label="Workbook Tabs">
          <Tabs.Item title="Dashboard">
            <div className="p-4">
              <div className="text-center text-gray-600">
                Add weeks and activities to your workbook before publishing.
              </div>
            </div>
          </Tabs.Item>
        </Tabs>
      </div>
    </div>
  );
}

export default EditWorkbook;
