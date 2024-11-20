import SearchBar from '../components/Searchbar.tsx';
import Carousel from '../components/Carousel.tsx';

function MyWorkbooks() {
    const items = [
        {
            id: 1,
            content: (
                <div className="text-center">
                    <img
                        src="https://via.placeholder.com/150"
                        alt="Item 1"
                        className="rounded-lg shadow-md"
                    />
                    <p className="mt-2 text-sm text-gray-700">Workbook 1</p>
                </div>
            ),
        },
        {
            id: 2,
            content: (
                <div className="text-center">
                    <img
                        src="https://via.placeholder.com/150"
                        alt="Item 2"
                        className="rounded-lg shadow-md"
                    />
                    <p className="mt-2 text-sm text-gray-700">Workbook 2</p>
                </div>
            ),
        },
        {
            id: 3,
            content: (
                <div className="text-center">
                    <img
                        src="https://via.placeholder.com/150"
                        alt="Item 3"
                        className="rounded-lg shadow-md"
                    />
                    <p className="mt-2 text-sm text-gray-700">Workbook 3</p>
                </div>
            ),
        },
        {
            id: 4,
            content: (
                <div className="text-center">
                    <img
                        src="https://via.placeholder.com/150"
                        alt="Item 4"
                        className="rounded-lg shadow-md"
                    />
                    <p className="mt-2 text-sm text-gray-700">Workbook 4</p>
                </div>
            ),
        },
        {
            id: 5,
            content: (
                <div className="text-center">
                    <img
                        src="https://via.placeholder.com/150"
                        alt="Item 5"
                        className="rounded-lg shadow-md"
                    />
                    <p className="mt-2 text-sm text-gray-700">Workbook 5</p>
                </div>
            ),
        },
        {
            id: 6,
            content: (
                <div className="text-center">
                    <img
                        src="https://via.placeholder.com/150"
                        alt="Item 6"
                        className="rounded-lg shadow-md"
                    />
                    <p className="mt-2 text-sm text-gray-700">Workbook 6</p>
                </div>
            ),
        },
    ];

    return (
        <>
            <div className="p-8 space-y-8">
            <h2 className="text-3xl font-bold text-left flex-grow">
                        My Workbooks
                    </h2>
                {/* row layout with SearchBar and Button */}
                <div className="flex items-center justify-between">
                    <div className="w-1/3">
                        <SearchBar />
                    </div>
                    
                    <div className="w-1/3 text-right">
                        <button
                            type="button"
                            className="text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5"
                        >
                            Create Workbook
                        </button>
                    </div>
                </div>

                {/* Carousel Section */}
                <div className="space-y-4">
                    <Carousel items={items} />
                </div>
            </div>
        </>
    );
}

export default MyWorkbooks;
