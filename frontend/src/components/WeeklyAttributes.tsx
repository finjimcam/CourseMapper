import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface GraduateAttribute {
  id: string;
  name: string;
}

interface WeeklyAttributesProps {
  weekNumber: number;
  workbookId?: string; // Make optional for backward compatibility
}

const WeeklyAttributes: React.FC<WeeklyAttributesProps> = ({ weekNumber, workbookId }) => {
  const [graduateAttributes, setGraduateAttributes] = useState<GraduateAttribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<GraduateAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchGraduateAttributes = async () => {
      console.log('WeeklyAttributes - workbookId:', workbookId);
      console.log('WeeklyAttributes - weekNumber:', weekNumber);
      
      if (!workbookId) {
        console.log('No workbookId provided');
        setGraduateAttributes([]);
        setSelectedAttributes([]);
        setLoading(false);
        return;
      }

      if (typeof workbookId !== 'string') {
        console.error('Invalid workbookId type:', typeof workbookId);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        console.log('Fetching graduate attributes with params:', {
          weekNumber,
          workbookId,
          url: `${import.meta.env.VITE_API}/graduate_attributes/`
        });

        const [attributesRes, selectedRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API}/graduate_attributes/`),
          axios.get(`${import.meta.env.VITE_API}/week-graduate-attributes/`, {
            params: { 
              week_number: weekNumber,
              week_workbook_id: workbookId
            },
          }),
        ]);

        console.log('Graduate attributes response:', attributesRes.data);
        console.log('Selected graduate attributes response:', selectedRes.data);
        console.log('Selected graduate attributes params:', selectedRes.config?.params);

        setGraduateAttributes(attributesRes.data);
        
        const selectedIds = selectedRes.data.map((item: any) => item.graduate_attribute_id);
        const selected = attributesRes.data.filter((attr: GraduateAttribute) => 
          selectedIds.includes(attr.id)
        );
        setSelectedAttributes(selected);
      } catch (error: any) {
        console.error('Error fetching graduate attributes:', {
          error: error.message,
          response: error.response?.data,
          config: error.config
        });
      }
      setLoading(false);
    };

    fetchGraduateAttributes();
  }, [weekNumber, workbookId]);

  const saveAttributes = async (newAttribute: GraduateAttribute, position: number) => {
    setSaving(true);
    try {
      console.log('Saving attributes with:', {
        weekNumber,
        workbookId,
        position,
        newAttribute
      });

      // Create a new array with the updated attribute at the specified position
      const updatedAttributes = [...selectedAttributes];
      updatedAttributes[position] = newAttribute;
      
      if (workbookId) {
        // Remove existing attributes for this week
        console.log('Deleting existing attributes...');
        
        // First, get current attributes for this week
        const currentAttributes = await axios.get(`${import.meta.env.VITE_API}/week-graduate-attributes/`, {
          params: { 
            week_number: weekNumber,
            week_workbook_id: workbookId
          }
        });
        
        console.log('Current attributes:', currentAttributes.data);
        
        // Delete each existing attribute
        for (const attr of currentAttributes.data) {
          console.log('Deleting attribute:', attr);
          await axios.delete(`${import.meta.env.VITE_API}/week-graduate-attributes/`, {
            data: { 
              week_number: weekNumber,
              week_workbook_id: workbookId,
              graduate_attribute_id: attr.graduate_attribute_id
            }
          });
        }

        // Save the new attributes
        for (const attr of updatedAttributes) {
          if (attr) {
            console.log('Saving new attribute:', {
              week_number: weekNumber,
              week_workbook_id: workbookId,
              graduate_attribute_id: attr.id
            });

            await axios.post(`${import.meta.env.VITE_API}/week-graduate-attributes/`, {
              week_number: weekNumber,
              week_workbook_id: workbookId,
              graduate_attribute_id: attr.id
            });
          }
        }

        // Refresh the selected attributes
        const [attributesRes, selectedRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API}/graduate_attributes/`),
          axios.get(`${import.meta.env.VITE_API}/week-graduate-attributes/`, {
            params: { 
              week_number: weekNumber,
              week_workbook_id: workbookId
            },
          }),
        ]);

        const selectedIds = selectedRes.data.map((item: any) => item.graduate_attribute_id);
        const selected = attributesRes.data.filter((attr: GraduateAttribute) => 
          selectedIds.includes(attr.id)
        );
        setSelectedAttributes(selected);
      } else {
        setSelectedAttributes(updatedAttributes);
      }
    } catch (error: any) {
      console.error('Error saving graduate attributes:', {
        error: error.message,
        response: error.response?.data,
        config: error.config
      });
    }
    setSaving(false);
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Graduate Attributes for Week {weekNumber}</h2>
      {!workbookId ? (
        <p>No workbook selected</p>
      ) : loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Graduate Attribute</label>
            <DropdownRadio 
              options={graduateAttributes}
              selected={selectedAttributes[0]}
              disabledOptions={selectedAttributes[1] ? [selectedAttributes[1]] : []}
              onSelect={(attr) => saveAttributes(attr, 0)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Second Graduate Attribute</label>
            <DropdownRadio 
              options={graduateAttributes}
              selected={selectedAttributes[1]}
              disabledOptions={selectedAttributes[0] ? [selectedAttributes[0]] : []}
              onSelect={(attr) => saveAttributes(attr, 1)}
            />
          </div>
          {saving && <p className="text-sm text-gray-500 mt-2">Saving changes...</p>}
        </div>
      )}
    </div>
  );
};

interface DropdownRadioProps {
  options: GraduateAttribute[];
  selected: GraduateAttribute | null;
  disabledOptions: GraduateAttribute[];
  onSelect: (attribute: GraduateAttribute) => void;
}

const DropdownRadio: React.FC<DropdownRadioProps> = ({ options, selected, disabledOptions, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
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
        {selected ? selected.name : "Select an Attribute"}
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
                  className={`flex items-center p-2 rounded-sm ${
                    disabledOptions.some(disabled => disabled.id === attr.id)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!disabledOptions.some(disabled => disabled.id === attr.id)) {
                      onSelect(attr);
                      setIsOpen(false);
                    }
                  }}
                >
                  <input
                    id={attr.id}
                    type="radio"
                    name="graduate-attribute"
                    checked={selected?.id === attr.id}
                    disabled={disabledOptions.some(disabled => disabled.id === attr.id)}
                    className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500 ${
                      disabledOptions.some(disabled => disabled.id === attr.id)
                        ? 'cursor-not-allowed'
                        : ''
                    }`}
                    onChange={() => {
                      if (!disabledOptions.some(disabled => disabled.id === attr.id)) {
                        onSelect(attr);
                        setIsOpen(false);
                      }
                    }}
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
