import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface GraduateAttribute {
  id: string;
  name: string;
}

interface WeeklyAttributesProps {
  weekNumber: number;
}

const WeeklyAttributes: React.FC<WeeklyAttributesProps> = ({ weekNumber }) => {
  const [graduateAttributes, setGraduateAttributes] = useState<GraduateAttribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<GraduateAttribute[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGraduateAttributes = async () => {
      setLoading(true);
      try {
        const [attributesRes, selectedRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API}/graduate_attributes/`),
          axios.get(`${import.meta.env.VITE_API}/week-graduate-attributes/`, {
            params: { week_number: weekNumber },
          }),
        ]);

        setGraduateAttributes(attributesRes.data);
        
        const selectedIds = selectedRes.data.map((item: any) => item.graduate_attribute_id);
        const selected = attributesRes.data.filter((attr: GraduateAttribute) => 
          selectedIds.includes(attr.id)
        );
        setSelectedAttributes(selected);
      } catch (error) {
        console.error('Error fetching graduate attributes:', error);
      }
      setLoading(false);
    };

    fetchGraduateAttributes();
  }, [weekNumber]);

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Graduate Attributes for Week {weekNumber}</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <DropdownRadio options={graduateAttributes} selected={selectedAttributes} />
      )}
    </div>
  );
};

const DropdownRadio: React.FC<{ options: GraduateAttribute[], selected: GraduateAttribute[] }> = ({ options, selected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAttr, setSelectedAttr] = useState<GraduateAttribute | null>(selected[0] || null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 flex items-center justify-between dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        {selectedAttr ? selectedAttr.name : "Select an Attribute"}
        <svg className="w-2.5 h-2.5 ml-2" aria-hidden="true" fill="none" viewBox="0 0 10 6">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700 dark:divide-gray-600 mt-2">
          <ul className="p-3 space-y-1 text-sm text-gray-700 dark:text-gray-200">
            {options.map((attr) => (
              <li key={attr.id}>
                <div
                  className="flex items-center p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                  onClick={() => setSelectedAttr(attr)}
                >
                  <input
                    id={attr.id}
                    type="radio"
                    name="graduate-attribute"
                    checked={selectedAttr?.id === attr.id}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                    onChange={() => setSelectedAttr(attr)}
                  />
                  <label htmlFor={attr.id} className="w-full ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                    {attr.name}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WeeklyAttributes;
