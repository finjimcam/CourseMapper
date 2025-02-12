import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb } from 'flowbite-react';
import axios from 'axios';

interface WorkbookData {
    id: string;
    course_name: string;
}

function Navbar() {
    const location = useLocation();
    const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);

    useEffect(() => {
        if (location.pathname.startsWith('/workbook/')) {
            const workbookId = location.pathname.split('/')[2];
            axios.get(`${import.meta.env.VITE_API}/workbooks/${workbookId}/details`)
                .then(response => {
                    setWorkbookData(response.data.workbook);
                })
                .catch(error => {
                    console.error('Error fetching workbook data:', error);
                });
        }
    }, [location.pathname]);
    return (
        <nav className="bg-white border-gray-200">
            <div className="relative flex items-center justify-between mx-auto p-4 w-full">
                <NavLink to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                    <img src="/LISU.png" className="w-[32px] sm:w-[64px] md:w-[96px] lg:w-[128px] xl:w-[256px]" alt="LISU Logo" />
                </NavLink>
                <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
                    <button
                        type="button"
                        className="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300"
                        id="user-menu-button"
                        aria-expanded="fase"
                        data-dropdown-toggle="user-dropdown"
                        data-dropdown-placement="bottom"
                    >
                        <span className="sr-only">Open user menu</span>
                        <img
                            className="w-8 h-8 rounded-full"
                            src="/docs/images/people/profile-picture-3.jpg"
                            alt="user photo"
                        />
                    </button>
                    <div
                        className="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow"
                        id="user-dropdown"
                    >
                        <div className="px-4 py-3">
                            <span className="block text-sm text-gray-900">Bonnie Green</span>
                            <span className="block text-sm text-gray-500 truncate">name@flowbite.com</span>
                        </div>
                        <ul className="py-2" aria-labelledby="user-menu-button">
                            <li>
                                <NavLink
                                    to="#"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Dashboard
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="#"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Settings
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="#"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Earnings
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="#"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Sign out
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                    <button
                        data-collapse-toggle="navbar-user"
                        type="button"
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        aria-controls="navbar-user"
                        aria-expanded="false"
                    >
                        <span className="sr-only">Open main menu</span>
                        <svg
                            className="w-5 h-5"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 17 14"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M1 1h15M1 7h15M1 13h15"
                            />
                        </svg>
                    </button>
                </div>
                {/* Center Section - Breadcrumb */}
                <div className="absolute left-1/2 transform -translate-x-1/2">
                {(location.pathname.startsWith('/workbook/') || location.pathname === '/my-workbooks') && (
                    <Breadcrumb aria-label="Breadcrumb" className="bg-transparent">
                    <Breadcrumb.Item href="/" className="text-gray-900 hover:text-blue-700">
                        Home
                    </Breadcrumb.Item>
                    {location.pathname === '/my-workbooks' ? (
                        <Breadcrumb.Item className="text-gray-700">My Workbooks</Breadcrumb.Item>
                    ) : (
                        <>
                        <Breadcrumb.Item href="/my-workbooks" className="text-gray-900 hover:text-blue-700">
                            My Workbooks
                        </Breadcrumb.Item>
                        <Breadcrumb.Item className="text-gray-700">{workbookData?.course_name || 'Workbook'}</Breadcrumb.Item>
                        </>
                    )}
                    </Breadcrumb>
                )}
                </div>
                <div
                    className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
                    id="navbar-user"    
                >
                    <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white">
                        {/* Other nav items can go here */}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
