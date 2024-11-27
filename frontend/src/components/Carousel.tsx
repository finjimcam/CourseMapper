import { useEffect, useState } from 'react';

interface CarouselItem {
  id: number;
  content: JSX.Element;
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
          <div
            key={item.id}
            className="carousel-item flex-none w-1/3 p-4 bg-gray-100 rounded-lg shadow-lg"
          >
            {item.content}
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
