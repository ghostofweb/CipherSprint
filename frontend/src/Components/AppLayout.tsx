import React, { Suspense, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Footer from './Footer';
import ThemePickerModal from './ThemePickerModal';
import SiteHeader from './SiteHeader';
import Spinner from './ui/Spinner';

// Shared chrome for every page except Home (which drives its own
// hide-while-typing behavior): header, footer and theme picker around the
// routed page, so the nav and footer are available everywhere.
function AppLayout() {
    const navigate = useNavigate();
    const [themePickerOpen, setThemePickerOpen] = useState(false);

    return (
        <div className="canvas analytics-canvas">
            <SiteHeader onLogoClick={() => navigate('/')} onOpenTheme={() => setThemePickerOpen(true)} />
            <main className="page">
                <Suspense fallback={<div className="route-loading"><Spinner size={20} /></div>}>
                    <Outlet />
                </Suspense>
            </main>
            <Footer onOpenThemePicker={() => setThemePickerOpen(true)} />
            <ThemePickerModal open={themePickerOpen} onClose={() => setThemePickerOpen(false)} />
        </div>
    );
}

export default AppLayout;
