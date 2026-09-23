import React, { Suspense } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Footer from './Footer';
import SiteHeader from './SiteHeader';
import Spinner from './ui/Spinner';

// Shared chrome for every page except Home and a race room (which drive
// their own hide-while-typing behavior): header and footer around the
// routed page.
function AppLayout() {
    const navigate = useNavigate();

    return (
        <div className="canvas">
            <SiteHeader onLogoClick={() => navigate('/')} />
            <main className="page">
                <Suspense fallback={<div className="route-loading"><Spinner size={20} /></div>}>
                    <Outlet />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}

export default AppLayout;
