import { Link } from "react-router-dom";
import { Workbook } from "../utils/workbookUtils";

const Grid: React.FC<{ workbooks: Workbook[] | null }> = ({ workbooks }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {workbooks ? (
      workbooks.map((item) => (
        <div
          key={item.workbook.id}
          className="carousel-item flex-none w-1/3 p-4 bg-gray-100 rounded-lg shadow-lg"
        >
          <Link
            to={`/workbook/${item.workbook.id}`}
            key={item.workbook.id}
            style={{ color: "inherit", textDecoration: "inherit" }}
          >
            <h6 className="text-lg font-bold dark:text-white">{item.workbook.course_name}</h6>
            <p className="text-gray-500 md:text-l dark:text-gray-400">{item.course_lead.name}</p>
            <p className="text-gray-500 md:text-l dark:text-gray-400">
              {item.learning_platform.name}
            </p>
          </Link>
        </div>
      ))
    ) : (
      <></>
    )}
  </div>
);

export default Grid;
