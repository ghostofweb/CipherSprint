import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../assets/Logo.svg?react';
import IconButton from './ui/IconButton';
import AccountCircle from './AccountCircle';
import { useSocial } from '../Context/SocialContext';
import { cx } from '../Utils/cx';

interface SiteHeaderProps {
    // True while a typing test is running: the nav and account fade out.
    hideChrome?: boolean;
    onLogoClick: () => void;
    onOpenTheme: () => void;
}

// The single header for every page (Home and the app layout used to each
// hand-roll their own copy).
function SiteHeader({ hideChrome, onLogoClick, onOpenTheme }: SiteHeaderProps) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { open, isOpen, pendingRequestCount, totalUnreadCount } = useSocial();

    return (
        <header className="site-header">
            <div className="header-left">
                <button type="button" className="brand" onClick={onLogoClick} aria-label="CipherSprint, go to the typing test">
                    <Logo className="brand-logo" />
                    <span className="brand-name">CipherSprint</span>
                </button>
                <nav className={cx('header-icons', hideChrome && 'chrome-hidden')} aria-label="Primary">
                    <IconButton icon="analytics" label="Analytics" active={pathname === '/user'} onClick={() => navigate('/user')} />
                    <IconButton icon="leaderboard" label="Leaderboard" active={pathname === '/leaderboard'} onClick={() => navigate('/leaderboard')} />
                    <IconButton
                        icon="chat"
                        label="Friends and groups"
                        active={isOpen}
                        badge={pendingRequestCount + totalUnreadCount}
                        onClick={() => open()}
                    />
                    <IconButton icon="settings" label="Themes" onClick={onOpenTheme} />
                </nav>
            </div>
            <AccountCircle hideChrome={hideChrome} />
        </header>
    );
}

export default SiteHeader;
