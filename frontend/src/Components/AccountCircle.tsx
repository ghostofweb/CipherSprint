import React, { useEffect, useState } from 'react';
import { Menu, MenuItem, Divider } from '@mui/material';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../Context/AuthContext';
import { onOpenAuthModal } from '../Utils/authModal';
import { cx } from '../Utils/cx';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import UsernameField from './UsernameField';
import Avatar from './Avatar';
import Dialog from './ui/Dialog';
import Button from './ui/Button';
import Icon from './ui/Icon';
import Switch from './ui/Switch';
import Tabs from './ui/Tabs';

interface AccountCircleProps {
    hideChrome?: boolean;
}

type AuthTab = 'login' | 'signup';

function AccountCircle({ hideChrome }: AccountCircleProps) {
    const { user, logout, updateVisibility, updatePresence, loginWithGoogle, completeGoogleSignup } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<AuthTab>('login');
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [pending, setPending] = useState<'visibility' | 'presence' | null>(null);
    const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
    const [chosenUsername, setChosenUsername] = useState('');
    const [chosenUsernameAvailable, setChosenUsernameAvailable] = useState(false);
    const [completingSignup, setCompletingSignup] = useState(false);

    const openModal = (initialTab: AuthTab) => {
        setTab(initialTab);
        setPendingGoogleToken(null);
        setChosenUsername('');
        setOpen(true);
    };

    const closeMenu = () => setAnchorEl(null);

    // Other parts of the app (the social panel for guests, a profile's "Log
    // in to add") ask for sign-in through an event so there is one auth modal.
    useEffect(() => onOpenAuthModal((requested) => openModal(requested)), []);

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) return;
        try {
            const res = await loginWithGoogle(credentialResponse.credential);
            if (res?.needsUsername && res.pendingToken) setPendingGoogleToken(res.pendingToken);
            else setOpen(false);
        } catch (err) {
            toast.error((err as Error).message || 'Google sign-in failed');
        }
    };

    const handleCompleteGoogleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chosenUsername.trim() || !chosenUsernameAvailable || completingSignup || !pendingGoogleToken) return;
        setCompletingSignup(true);
        try {
            await completeGoogleSignup(pendingGoogleToken, chosenUsername.trim());
            setOpen(false);
        } catch (err) {
            toast.error((err as Error).message || "Couldn't finish signing in");
        } finally {
            setCompletingSignup(false);
        }
    };

    const toggle = async (which: 'visibility' | 'presence') => {
        if (!user) return;
        setPending(which);
        try {
            if (which === 'visibility') await updateVisibility(!user.isPublic);
            else await updatePresence(!(user.showPresence !== false));
        } catch (err) {
            toast.error((err as Error).message || "Couldn't update that setting");
        } finally {
            setPending(null);
        }
    };

    if (user) {
        return (
            <div className={cx('user-badge', hideChrome && 'chrome-hidden')}>
                <button
                    type="button"
                    className="account-trigger"
                    aria-haspopup="menu"
                    aria-expanded={!!anchorEl}
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                    <Avatar url={user.avatarUrl} name={user.username} size="sm" />
                    <span>{user.username}</span>
                </button>
                <Menu
                    anchorEl={anchorEl}
                    open={!!anchorEl}
                    onClose={closeMenu}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{ paper: { className: 'ui-menu-paper' } }}
                >
                    <MenuItem className="ui-menu-item" onClick={() => { closeMenu(); navigate(`/u/${user.username}`); }}>
                        <Icon name="user" size={16} />
                        My profile
                    </MenuItem>
                    <MenuItem className="ui-menu-item" onClick={() => { closeMenu(); navigate('/settings'); }}>
                        <Icon name="settings" size={16} />
                        Settings
                    </MenuItem>
                    {user.isAdmin && (
                        <MenuItem className="ui-menu-item" onClick={() => { closeMenu(); navigate('/admin/reports'); }}>
                            <Icon name="shield" size={16} />
                            Reports
                        </MenuItem>
                    )}
                    <Divider className="ui-menu-divider" />
                    <div className="ui-menu-row">
                        <span>Public profile</span>
                        <Switch label="Public profile" checked={!!user.isPublic} disabled={pending === 'visibility'} onChange={() => toggle('visibility')} />
                    </div>
                    <div className="ui-menu-row">
                        <span>Show online status</span>
                        <Switch label="Show online status" checked={user.showPresence !== false} disabled={pending === 'presence'} onChange={() => toggle('presence')} />
                    </div>
                    <Divider className="ui-menu-divider" />
                    <MenuItem className="ui-menu-item" onClick={() => { closeMenu(); logout(); }}>
                        <Icon name="logout" size={16} />
                        Log out
                    </MenuItem>
                </Menu>
            </div>
        );
    }

    return (
        <>
            <div className={cx('user-badge', hideChrome && 'chrome-hidden')}>
                <Button size="sm" onClick={() => openModal('login')}>Log in</Button>
            </div>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                width={380}
                title={pendingGoogleToken ? 'Choose a username' : tab === 'login' ? 'Welcome back' : 'Create your account'}
            >
                {pendingGoogleToken ? (
                    <form className="auth-form" onSubmit={handleCompleteGoogleSignup}>
                        <p className="auth-lead">Pick the name other players will see.</p>
                        <UsernameField
                            value={chosenUsername}
                            onChange={setChosenUsername}
                            onAvailabilityChange={setChosenUsernameAvailable}
                            autoFocus
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            className="ui-btn--block"
                            loading={completingSignup}
                            disabled={!chosenUsername.trim() || !chosenUsernameAvailable}
                        >
                            Continue
                        </Button>
                    </form>
                ) : (
                    <>
                        <div className="auth-google">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => toast.error('Google sign-in failed')}
                                theme="filled_black"
                                size="large"
                                width="332"
                            />
                        </div>
                        <div className="auth-divider"><span>or</span></div>
                        <Tabs<AuthTab>
                            label="Log in or sign up"
                            value={tab}
                            onChange={setTab}
                            tabs={[
                                { id: 'login', label: 'log in' },
                                { id: 'signup', label: 'sign up' },
                            ]}
                        />
                        {tab === 'login' ? <LoginForm onSuccess={() => setOpen(false)} /> : <SignupForm onSuccess={() => setOpen(false)} />}
                    </>
                )}
            </Dialog>
        </>
    );
}

export default AccountCircle;
