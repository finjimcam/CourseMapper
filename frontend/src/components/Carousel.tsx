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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Area, School } from '../utils/workbookUtils';

const MAX_ITEMS = 5; // Maximum number of items to display

interface CarouselItem {
  id: number;
  workbookId?: string; // Optional field for actual workbook ID
  start_date: string;
  end_date: string;
  course_lead_id: string;
  learning_platform_id: string;
  course_name: string;
  course_lead: string;
  learning_platform: string;
  area_id?: string;
  school_id?: string | null;
}

function Carousel({ items }: { items: Array<CarouselItem> }) {
  const [currentPosition, setCurrentPosition] = useState(0);
  const carouselSize = 5;
  const [visibleItems, setVisibleItems] = useState<Array<CarouselItem>>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [areasResponse, schoolsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API}/area/`),
          axios.get(`${import.meta.env.VITE_API}/schools/`)
        ]);
        setAreas(areasResponse.data);
        setSchools(schoolsResponse.data);
      } catch (error) {
        console.error('Error fetching area/school data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getAreaName = (areaId: string | undefined) => {
    if (isLoading) return 'Loading...';
    if (!areaId) {
      return 'N/A';
    }
    if (areas.length === 0) {
      return 'Loading...';
    }
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : 'N/A';
  };

  const getSchoolName = (schoolId: string | null | undefined) => {
    if (isLoading) return 'Loading...';
    if (!schoolId) {
      return 'N/A';
    }
    if (schools.length === 0) {
      return 'Loading...';
    }
    const school = schools.find(s => s.id === schoolId);
    return school ? school.name : 'N/A';
  };

  useEffect(() => {
    // Limit total items to MAX_ITEMS
    const limitedItems = items.slice(0, MAX_ITEMS);

    if (limitedItems.length < carouselSize) {
      setVisibleItems(limitedItems);
    } else {
      const settingItems: CarouselItem[] = [];
      for (let i = currentPosition; i < currentPosition + carouselSize; i++) {
        settingItems.push(limitedItems[i % limitedItems.length]);
      }
      setVisibleItems(settingItems);
    }
  }, [currentPosition, items]);

  const limitedItems = items.slice(0, MAX_ITEMS);

  const nextSlide = () => {
    setCurrentPosition((prevPosition) => (prevPosition + 1) % limitedItems.length);
  };

  const prevSlide = () => {
    setCurrentPosition(
      (prevPosition) => (prevPosition - 1 + limitedItems.length) % limitedItems.length
    );
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto" data-carousel="slide">
      {/* Carousel wrapper */}
      <div className="relative h-48 overflow-hidden rounded-lg md:h-72">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className={`carousel-item ${currentPosition === limitedItems.indexOf(item) ? 'block' : 'hidden'} duration-700 ease-in-out`}
            data-carousel-item
          >
            <Link
              to={`/workbook/${item.workbookId || item.id}`}
              style={{ color: 'inherit', textDecoration: 'inherit' }}
            >
              <div className="absolute block w-full h-full bg-gray-100 rounded-lg shadow-lg p-4">
                <h6 className="text-lg font-bold dark:text-white">{item.course_name}</h6>
                <p className="text-gray-500 md:text-l dark:text-gray-400">Lead: {item.course_lead}</p>
                <p className="text-gray-500 md:text-l dark:text-gray-400">
                  Platform: {item.learning_platform}
                </p>
                <p className="text-gray-500 md:text-l dark:text-gray-400">
                  Area: {getAreaName(item.area_id)}
                </p>
                <p className="text-gray-500 md:text-l dark:text-gray-400">
                  School: {getSchoolName(item.school_id)}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Slider indicators */}
      <div className="absolute z-10 flex -translate-x-1/2 bottom-5 left-1/2 space-x-3 rtl:space-x-reverse">
        {limitedItems.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`w-3 h-3 rounded-full ${currentPosition === index ? 'bg-blue-600' : 'bg-gray-400'}`}
            aria-current={currentPosition === index ? 'true' : 'false'}
            aria-label={`Slide ${index + 1}`}
            onClick={() => setCurrentPosition(index)}
            data-carousel-slide-to={index}
          ></button>
        ))}
      </div>

      {/* Slider controls */}
      <button
        type="button"
        className="absolute top-0 start-0 z-10 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
        onClick={prevSlide}
        data-carousel-prev
      >
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full group-focus:ring-4 group-focus:ring-white">
          <svg
            className="w-4 h-4 text-black dark:text-white rtl:rotate-180"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 6 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 1 1 5l4 4"
            />
          </svg>
          <span className="sr-only">Previous</span>
        </span>
      </button>

      <button
        type="button"
        className="absolute top-0 end-0 z-10 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
        onClick={nextSlide}
        data-carousel-next
      >
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full group-focus:ring-4 group-focus:ring-white">
          <svg
            className="w-4 h-4 text-black dark:text-white rtl:rotate-180"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 6 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 9 4-4-4-4"
            />
          </svg>
          <span className="sr-only">Next</span>
        </span>
      </button>
    </div>
  );
}

export default Carousel;
