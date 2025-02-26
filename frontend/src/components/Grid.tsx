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
