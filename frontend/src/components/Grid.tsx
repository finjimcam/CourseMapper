import { Link } from 'react-router-dom';
import { Workbook } from '../utils/workbookUtils';

const Grid: React.FC<{ workbooks: Workbook[] | null }> = ({ workbooks }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {workbooks ? (
      workbooks.map((item) => (
        <div
          key={item.workbook.id}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-200"
        >
          <Link to={`/workbook/${item.workbook.id}`} className="block text-gray-800 no-underline">
            <h6 className="text-lg font-bold mb-2">{item.workbook.course_name}</h6>
            <p className="text-gray-500">{item.course_lead.name}</p>
            <p className="text-gray-500">{item.learning_platform.name}</p>
          </Link>
        </div>
      ))
    ) : (
      <p className="col-span-full text-center text-gray-500">No workbooks found.</p>
    )}
  </div>
);

export default Grid;
