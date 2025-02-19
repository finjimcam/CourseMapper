import { FormEvent, useState } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';

function SearchBar() {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState("");

    function makeSearch(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        console.log(searchInput);
        navigate({pathname: `/results`, search: createSearchParams({name: searchInput}).toString()});
    }

    return (
        <form 
            onSubmit={(e) => makeSearch(e)} 
            className="flex items-center w-full max-w-sm">
            <label htmlFor="simple-search" className="sr-only">Search</label>
            <div className="relative w-full">
                <input
                    type="text"
                    id="simple-search"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Search workbooks..."
                    required
                    onChange={(e) => setSearchInput(e.target.value)}
                />
            </div>
            <button
                type="submit"
                className="p-2.5 ml-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 20 20">
                    <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                    />
                </svg>
                <span className="sr-only">Search</span>
            </button>
        </form>
    );
}

export default SearchBar;
