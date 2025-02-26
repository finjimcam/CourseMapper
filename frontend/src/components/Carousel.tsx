import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface CarouselItem {
  id: number;
  start_date: string;
  end_date: string;
  course_lead_id: string;
  learning_platform_id: string;
  course_name: string;
  course_lead: string;
  learning_platform: string;
}

function Carousel({ items }: { items: Array<CarouselItem> }) {
  const [currentPosition, setCurrentPosition] = useState(0);
  const carouselSize = 3;
  const [visibleItems, setVisibleItems] = useState<Array<CarouselItem>>([]);

  useEffect(() => {
    if (items.length < carouselSize) {
      setVisibleItems(items);
    } else {
      const settingItems: CarouselItem[] = [];
      for (let i = currentPosition; i < currentPosition + carouselSize; i++) {
        settingItems.push(items[i % items.length]);
      }
      setVisibleItems(settingItems);
    }
  }, [currentPosition, items]);

  const nextSlide = () => {
    setCurrentPosition((prevPosition) => (prevPosition + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentPosition((prevPosition) => (prevPosition - 1 + items.length) % items.length);
  };

  return (
    <div className="carousel-container max-w-3xl mx-auto overflow-hidden">
      <div className="carousel-inner flex space-x-4">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="carousel-item flex-none w-1/3 p-4 bg-gray-100 rounded-lg shadow-lg"
          >
            <Link
              to={`/workbook/${item.id}`}
              key={item.id}
              style={{ color: 'inherit', textDecoration: 'inherit' }}
            >
              <h6 className="text-lg font-bold dark:text-white">{item.course_name}</h6>
              <p className="text-gray-500 md:text-l dark:text-gray-400">{item.course_lead}</p>
              <p className="text-gray-500 md:text-l dark:text-gray-400">
                {item.learning_platform}
              </p>
            </Link>
          </div>
        </Link>
      </div>
    ))}
  </div>

      {/* Slider indicators */}
      <div className="absolute z-30 flex -translate-x-1/2 bottom-5 left-1/2 space-x-3 rtl:space-x-reverse">
        {visibleItems.map((_, index) => (
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
        className="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
        onClick={prevSlide}
        data-carousel-prev>
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full group-focus:ring-4 group-focus:ring-white">
          <svg className="w-4 h-4 text-black dark:text-white rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1 1 5l4 4" />
          </svg>
          <span className="sr-only">Previous</span>
        </span>
      </button>

      <button
        type="button"
        className="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
        onClick={nextSlide}
        data-carousel-next>
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full group-focus:ring-4 group-focus:ring-white">
          <svg className="w-4 h-4 text-black dark:text-white rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
          </svg>
          <span className="sr-only">Next</span>
        </span>
      </button>
    </div>
  );
}

export default Carousel;
