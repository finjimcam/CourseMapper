import SearchBar from '../components/Searchbar.tsx';
import Carousel from '../components/Carousel.tsx';

function Home() {
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
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-left">Welcome back, Bob!</h2>
                    <h3 className="text-lg text-left text-gray-600">
                        Explore and manage your courses with ease
                    </h3>
                </div>

                {/* Align SearchBar and Button to the left */}
                <div className="flex flex-col items-start space-y-4">
                    <SearchBar />
                    <button
                        type="button"
                        className="text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5"
                    >
                        Create Workbook
                    </button>
                </div>

                <div className="space-y-4">
                    <h1 className="text-2xl font-semibold text-left">Recent Workbooks</h1>
                    <Carousel items={items} />
                </div>
            </div>
        </>
    );
}

export default Home;
