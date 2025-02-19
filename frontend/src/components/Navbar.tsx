import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, Dropdown } from 'flowbite-react';
import axios from 'axios';

interface WorkbookData {
    id: string;
    course_name: string;
}

function Navbar() {
    const location = useLocation();
    const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
    const [username, setUsername] = useState('');

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

    useEffect(() => {
        // Fetch user data when component mounts
        axios.get(`${import.meta.env.VITE_API}/session/`, {
            withCredentials: true
        })
        .then((sessionResponse) => {
            // Get user details using the user_id from session
            return axios.get(`${import.meta.env.VITE_API}/users/`).then(usersResponse => ({
                sessionData: sessionResponse.data,
                users: usersResponse.data
            }));
        })
        .then(({ sessionData, users }) => {
            const currentUser = users.find(user => user.id === sessionData.user_id);
            if (currentUser) {
                setUsername(currentUser.name);
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            setUsername(''); // Reset username on error
        });
    }, [location.pathname]); // Add location.pathname to dependency array to re-run on navigation

    const handleLogout = async () => {
        try {
            await axios.delete(`${import.meta.env.VITE_API}/session/`, {
                withCredentials: true
            });
            setUsername(''); // Reset username state on logout
            window.location.href = '/login'; // Redirect to login page instead
        } catch (err) {
            console.error('Failed to log out', err);
        }
    };

    return (
        <nav className="bg-white border-gray-200">
            <div className="flex flex-wrap items-center justify-between mx-auto p-4">
                <NavLink to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                    <img src="/LISU.png" className="h-8" alt="LISU Logo" />
                </NavLink>
                <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
                    <Dropdown
                        arrowIcon={false}
                        inline
                        label={
                            <img
                                className="w-8 h-8 rounded-full"
                                src="/user.png"
                                alt="user photo"
                            />
                        }
                    >
                        <Dropdown.Header>
                            <span className="block text-sm text-gray-900">{username || 'User'}</span>
                        </Dropdown.Header>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={handleLogout}>
                            Sign out
                        </Dropdown.Item>
                    </Dropdown>
                    
                </div>
                <div className="flex items-center space-x-4">
                    {!location.pathname.startsWith('/workbook/') && location.pathname !== '/my-workbooks' && (
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `block py-2 px-3 rounded md:p-0 ${
                                    isActive ? 'text-white bg-blue-700 md:bg-transparent' : 'text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700'
                                }`
                            }
                        >
                            Home
                        </NavLink>
                    )}
                    {(location.pathname.startsWith('/workbook/') || location.pathname === '/my-workbooks') && (
                        <div className="flex items-center h-full">
                            {location.pathname.startsWith('/workbook/') && (
                                <Breadcrumb aria-label="Breadcrumb" className="bg-transparent">
                                    <Breadcrumb.Item 
                                        href="/"
                                            className={`flex items-center text-sm font-medium ${
                                                location.pathname.startsWith('/') 
                                                    ? 'text-gray-700' 
                                                    : 'text-gray-900 hover:text-blue-700'
                                            }`}
                                    >
                                        Home
                                    </Breadcrumb.Item>
                                    <Breadcrumb.Item 
                                        href="/my-workbooks"
                                        className={`flex items-center text-sm font-medium ${
                                            location.pathname === '/my-workbooks' 
                                                ? 'text-gray-700' 
                                                : 'text-gray-900 hover:text-blue-700'
                                        }`}
                                    >
                                        My Workbooks
                                    </Breadcrumb.Item>
                                    <Breadcrumb.Item className="text-gray-700">
                                        {workbookData?.course_name || 'Workbook'}
                                    </Breadcrumb.Item>
                                </Breadcrumb>
                            )}
                            {location.pathname === '/my-workbooks' && (
                                <Breadcrumb aria-label="Breadcrumb" className="bg-transparent">
                                    <Breadcrumb.Item 
                                        href="/"
                                        className={`flex items-center text-sm font-medium ${
                                            location.pathname.startsWith('/') 
                                                ? 'text-gray-700' 
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        Home
                                    </Breadcrumb.Item>
                                    <Breadcrumb.Item className="text-gray-700">
                                        My Workbooks
                                    </Breadcrumb.Item>
                                </Breadcrumb>
                            )}
                        </div>
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
