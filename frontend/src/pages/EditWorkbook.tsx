// EditWorkbook.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Tabs, Spinner, Button, Modal } from 'flowbite-react';

interface Activity {
  id: string;
  name: string;
  time_estimate_minutes: number;
  week_number: number;
  location_id: string;
  learning_activity_id: string;
  learning_type_id: string;
  task_status_id: string;
}

interface Week {
  workbook_id: string;
  number: number;
  start_date: string;
  end_date: string;
}

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
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Fetch weeks and activities when workbook data is loaded
  useEffect(() => {
    const fetchWorkbookDetails = async () => {
      try {
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

          // Fetch weeks and activities if workbook ID exists
          if (data.id) {
            const [weeksResponse, activitiesResponse] = await Promise.all([
              axios.get(`http://127.0.0.1:8000/weeks/?workbook_id=${data.id}`),
              axios.get(`http://127.0.0.1:8000/activities/?workbook_id=${data.id}`)
            ]);
            setWeeks(weeksResponse.data);
            setActivities(activitiesResponse.data);
          }
          
          setLoading(false);
        } else {
          setError('No workbook data found');
          setLoading(false);
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : 'Failed to fetch workbook details';
        setError(error);
        setLoading(false);
      }
    };

    fetchWorkbookDetails();
  }, []);

  const validateWorkbook = (): string[] => {
    const errors: string[] = [];

    // Check required workbook fields
    if (!workbookData) {
      errors.push('Workbook data is missing');
      return errors;
    }

    if (!workbookData.course_name) {
      errors.push('Course name is required');
    }

    if (!workbookData.learning_platform_id) {
      errors.push('Learning platform is required');
    }

    // Validate dates
    const startDate = new Date(workbookData.start_date);
    const endDate = new Date(workbookData.end_date);

    if (isNaN(startDate.getTime())) {
      errors.push('Start date is invalid');
    }

    if (isNaN(endDate.getTime())) {
      errors.push('End date is invalid');
    }

    if (startDate >= endDate) {
      errors.push('Start date must be earlier than end date');
    }

    // Check for weeks and activities
    if (weeks.length === 0) {
      errors.push('At least one week is required');
    }

    if (activities.length === 0) {
      errors.push('At least one activity is required');
    }

    // Validate activities
    activities.forEach((activity, index) => {
      if (!activity.name) {
        errors.push(`Activity ${index + 1}: Name is required`);
      }
      if (!activity.time_estimate_minutes) {
        errors.push(`Activity ${index + 1}: Time estimate is required`);
      }
      if (!activity.location_id) {
        errors.push(`Activity ${index + 1}: Location is required`);
      }
      if (!activity.learning_activity_id) {
        errors.push(`Activity ${index + 1}: Learning activity is required`);
      }
      if (!activity.learning_type_id) {
        errors.push(`Activity ${index + 1}: Learning type is required`);
      }
      if (!activity.task_status_id) {
        errors.push(`Activity ${index + 1}: Task status is required`);
      }
    });

    return errors;
  };

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

    // Validate before publishing
    const errors = validateWorkbook();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

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
      {/* Validation Error Modal */}
      <Modal show={showValidationModal} onClose={() => setShowValidationModal(false)}>
        <Modal.Header>Cannot Publish Workbook</Modal.Header>
        <Modal.Body>
          <div className="space-y-2">
            <p className="text-red-500 font-medium">Please fix the following issues:</p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-gray-700">{error}</li>
              ))}
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowValidationModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

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
