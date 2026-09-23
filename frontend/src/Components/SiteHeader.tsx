import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import IconButton from './ui/IconButton';
import AccountCircle from './AccountCircle';
import Wordmark from './Wordmark';
import OfflineBanner from './OfflineBanner';
import { useSocial } from '../Context/SocialContext';
import { cx } from '../Utils/cx';

interface SiteHeaderProps {
    // True while a typing test is running: the nav and account fade out.
    hideChrome?: boolean;
    // The wordmark's caret blinks while a test waits for its first key.
    idle?: boolean;
    onLogoClick: () => void;
}

// The single header for every page.
function SiteHeader({ hideChrome, idle = false, onLogoClick }: SiteHeaderProps) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { open, isOpen, pendingRequestCount, totalUnreadCount } = useSocial();

    return (
        <header className="site-header">
            <div className="header-left">
                <button type="button" className="brand" onClick={onLogoClick} aria-label="CipherSprint, go to the typing test">
                    <Wordmark idle={idle} className="brand-full" />
                    <Wordmark idle={idle} compact className="brand-compact" />
                </button>
                <nav className={cx('header-icons', hideChrome && 'chrome-hidden')} aria-label="Primary">
                    <IconButton icon="race" label="Race" active={pathname.startsWith('/race')} onClick={() => navigate('/race')} />
                    <IconButton icon="leaderboard" label="Leaderboard" active={pathname === '/leaderboard'} onClick={() => navigate('/leaderboard')} />
                    <IconButton icon="analytics" label="Analytics" active={pathname === '/user'} onClick={() => navigate('/user')} />
                    <IconButton
                        icon="chat"
                        label="Friends and groups"
                        active={isOpen}
                        badge={pendingRequestCount + totalUnreadCount}
                        onClick={() => open()}
                    />
                    <IconButton icon="settings" label="Settings" active={pathname === '/settings'} onClick={() => navigate('/settings')} />
                </nav>
            </div>
            <div className={cx('header-right', hideChrome && 'chrome-hidden')}>
                <OfflineBanner />
                <AccountCircle hideChrome={hideChrome} />
            </div>
        </header>
    );
}

export default SiteHeader;
