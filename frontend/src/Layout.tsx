import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import FooterComponent from './components/Footer';

function Layout() {
    return (
      <div className="root-layout">
        <div className="min-h-screen w-full flex flex-col">
          <Navbar />

          <main className="flex-grow w-full">
            <Outlet />
          </main>
          
          <FooterComponent />
        </div>
      </div>
    );
  };

export default Layout
