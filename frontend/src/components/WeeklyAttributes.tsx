import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { CustomBadge, graduateAttributeColors } from './CustomBadge';
import { normalizeKey } from '../utils/stringUtils';
import { isCourseLead } from '../utils/workbookUtils';

interface GraduateAttribute {
  id: string;
  name: string;
}

interface WeeklyAttributesProps {
  weekNumber: number;
  workbookId?: string; // Make optional for backward compatibility
  onAttributesChange?: () => void;
}

const WeeklyAttributes: React.FC<WeeklyAttributesProps> = ({ weekNumber, workbookId, onAttributesChange }) => {
  const [graduateAttributes, setGraduateAttributes] = useState<GraduateAttribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<GraduateAttribute[]>([]);
  const [ifCourseLead, setIfCourseLead] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAttributes = async () => {
    try {
      const selectedRes = await axios.get(`${import.meta.env.VITE_API}/week-graduate-attributes/`, {
        params: { 
          week_number: weekNumber,
          week_workbook_id: workbookId
        },
      });

      const selectedIds = selectedRes.data.map((item: any) => item.graduate_attribute_id);
      const selected = graduateAttributes.filter((attr: GraduateAttribute) => 
        selectedIds.includes(attr.id)
      );
      setSelectedAttributes(selected);
      setError(null);
    } catch (error: any) {
      setError('Failed to refresh attributes. Please try again.');
    }
  };

  // Effect for handling week changes
  useEffect(() => {
    setSelectedAttributes([]); // Clear selected attributes immediately on week change
    refreshAttributes(); // Fetch new attributes for the current week
  }, [weekNumber]);

  // Effect for fetching graduate attributes
  useEffect(() => {
    let mounted = true;
    const fetchGraduateAttributes = async () => {
      if (!mounted) return;

      setLoading(true);
      setError(null);

      // Input validation
      if (!workbookId || typeof workbookId !== 'string') {
        setError('Invalid workbook ID');
        setLoading(false);
        return;
      } else {
        setIfCourseLead(await isCourseLead(workbookId));
      }

      if (typeof weekNumber !== 'number' || weekNumber < 1) {
        setError('Invalid week number');
        setLoading(false);
        return;
      }
      
      try {
        // First fetch all graduate attributes if not already loaded
        if (graduateAttributes.length === 0) {
          const attributesRes = await axios.get(`${import.meta.env.VITE_API}/graduate_attributes/`);
          if (!mounted) return;
          
          const attributes = attributesRes.data;
          attributes.forEach((attr: GraduateAttribute) => {
            const normalizedKey = normalizeKey(attr.name);
            if (!graduateAttributeColors[normalizedKey]) {
              console.warn(`No color mapping found for attribute: ${attr.name} (key: ${normalizedKey})`);
            }
          });
          setGraduateAttributes(attributes);
        }

        // Then fetch selected attributes for the current week
        const selectedRes = await axios.get(`${import.meta.env.VITE_API}/week-graduate-attributes/`, {
          params: { 
            week_number: weekNumber,
            week_workbook_id: workbookId
          },
        });
        
        if (!mounted) return;

        const selectedIds = selectedRes.data.map((item: any) => item.graduate_attribute_id);
        const selected = graduateAttributes.filter((attr: GraduateAttribute) => 
          selectedIds.includes(attr.id)
        );
        
        setSelectedAttributes(selected);
        setError(null);
      } catch (error) {
        if (!mounted) return;
        setError('Failed to fetch graduate attributes');
        setSelectedAttributes([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchGraduateAttributes();
    return () => {
      mounted = false;
    };
  }, [weekNumber, workbookId, graduateAttributes, ifCourseLead]); // Include graduateAttributes in dependencies

  const saveAttributes = async (newAttribute: GraduateAttribute, position: number) => {
    setSaving(true);
    setError(null);
    try {
      console.log('Saving attributes with:', {
        weekNumber,
        workbookId,
        position,
        newAttribute
      });

      if (!workbookId) {
        // If no workbookId, just update the local state
        const updatedAttributes = [...selectedAttributes];
        updatedAttributes[position] = newAttribute;
        setSelectedAttributes(updatedAttributes);
        return;
      }

      // Get current attributes for this week
      const currentAttributes = await axios.get(`${import.meta.env.VITE_API}/week-graduate-attributes/`, {
        params: { 
          week_number: weekNumber,
          week_workbook_id: workbookId
        }
      });
      
      // Find if there's an existing attribute at this position
      const existingAttrAtPosition = currentAttributes.data[position];
      
      if (existingAttrAtPosition) {
        // Delete only the attribute at this position
        console.log('Deleting attribute at position:', position);
        await axios.delete(`${import.meta.env.VITE_API}/week-graduate-attributes/`, {
          data: { 
            week_number: weekNumber,
            week_workbook_id: workbookId,
            graduate_attribute_id: existingAttrAtPosition.graduate_attribute_id
          }
        });
      }

      await axios.post(`${import.meta.env.VITE_API}/week-graduate-attributes/`, {
        week_number: weekNumber,
        week_workbook_id: workbookId,
        graduate_attribute_id: newAttribute.id
      });

      // Update the local state immediately
      const updatedAttributes = [...selectedAttributes];
      updatedAttributes[position] = newAttribute;
      setSelectedAttributes(updatedAttributes);

      // Refresh from server to ensure consistency
      await refreshAttributes();
      onAttributesChange?.();
    } catch (error: any) {
      console.error('Error saving graduate attributes:', {
        error: error.message,
        response: error.response?.data,
        config: error.config
      });
      
      // Handle permission errors
      if (error.response?.status === 403) {
        setError('Permission denied. You do not have permission to modify graduate attributes.');
      } else {
        setError('Failed to save graduate attribute. Please try again.');
      }
      
      // Refresh to ensure consistency
      await refreshAttributes();
    }
    setSaving(false);
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Graduate Attributes</h2>
      {!workbookId ? (
        <p>No workbook selected</p>
      ) : loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}
          {ifCourseLead ? 
            <>
            <div>
              <DropdownRadio 
                options={graduateAttributes}
                selected={selectedAttributes[0]}
                disabledOptions={selectedAttributes[1] ? [selectedAttributes[1]] : []}
                onSelect={(attr) => saveAttributes(attr, 0)}
              />
            </div>
            <div>
              <DropdownRadio 
                options={graduateAttributes}
                selected={selectedAttributes[1]}
                disabledOptions={selectedAttributes[0] ? [selectedAttributes[0]] : []}
                onSelect={(attr) => saveAttributes(attr, 1)}
              />
            </div>
            {saving && <p className="text-sm text-gray-500 mt-2">Saving changes...</p>}
            </> :
            <>
            {selectedAttributes[0] ? <CustomBadge label={selectedAttributes[0].name} colorMapping={graduateAttributeColors} /> : null}
            {selectedAttributes[1] ? <CustomBadge label={selectedAttributes[1].name} colorMapping={graduateAttributeColors} /> : null}
            </> 
          }
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
        style={{
          backgroundColor: selected ? graduateAttributeColors[normalizeKey(selected.name)] : '#6c757d'
        }}
        className="w-full text-left focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm flex items-center justify-between"
      >
        {selected ? <CustomBadge label={selected.name} colorMapping={graduateAttributeColors} /> 
        : <CustomBadge label={"Select an Attribute"} colorMapping={graduateAttributeColors} />}
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
                      : 'hover:bg-gray-100 cursor-pointer'
                  }`}
                  style={{
                    backgroundColor: selected?.id === attr.id ? graduateAttributeColors[normalizeKey(attr.name)] : 'transparent'
                  }}
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
