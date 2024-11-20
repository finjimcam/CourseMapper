import  { useState } from 'react';

function Carousel({ items }: { items: Array<{ id: number; content: string }> }) {
  const [currentPosition, setCurrentPosition] = useState(0);

  const nextSlide = () => {
    setCurrentPosition((prevPosition) => (prevPosition + 3) % items.length);
  };

  const prevSlide = () => {
    setCurrentPosition((prevPosition) =>
      (prevPosition - 3 + items.length) % items.length
    );
  };

  // Get the 3 items to display based on the current position
  const visibleItems = [
    items[currentPosition],
    items[(currentPosition + 1) % items.length],
    items[(currentPosition + 2) % items.length],
  ];

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
