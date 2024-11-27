import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface CarouselItem {
  id: number;
  start_date: string;
  end_date: string;
  course_id: string;
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
      let settingItems: CarouselItem[] = [];
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
          <div key={item.id}
            className="carousel-item flex-none w-1/3 p-4 bg-gray-100 rounded-lg shadow-lg">
          <Link to={`/workbook/${item.id}`} key={item.id} style={{ color: 'inherit', textDecoration: 'inherit'}}>
            <h6 className="text-lg font-bold dark:text-white">{item.course_name}</h6>
            <p className="text-gray-500 md:text-l dark:text-gray-400">{item.course_lead}</p>
            <p className="text-gray-500 md:text-l dark:text-gray-400">{item.learning_platform}</p>
          </Link>
          </div>
        ))}
      </div>

      <div className="carousel-controls flex justify-between mt-4">
        <button
          onClick={prevSlide}
          className="p-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Previous
        </button>
        <button
          onClick={nextSlide}
          className="p-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Carousel;
