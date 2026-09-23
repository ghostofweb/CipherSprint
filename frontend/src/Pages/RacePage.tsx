import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DEFAULT_RACE_SETTINGS, raceCodeSchema, raceSettingsSchema } from '@ciphersprint/shared';
import type { RaceSettings, RaceSnapshot } from '@ciphersprint/shared';
import Button from '../Components/ui/Button';
import Input from '../Components/ui/Input';
import Spinner from '../Components/ui/Spinner';
import EmptyState from '../Components/ui/EmptyState';
import RaceSettingsForm from '../Components/race/RaceSettingsForm';
import QuickMatch from '../Components/race/QuickMatch';
import { useAuth } from '../Context/AuthContext';
import { openAuthModal } from '../Utils/authModal';
import { raceCall } from '../Utils/raceSocket';

const STORAGE_KEY = 'raceSettings';

// The last rules you raced with are the ones you probably want next time.
function loadSettings(): RaceSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = raceSettingsSchema.safeParse(JSON.parse(raw));
            if (parsed.success) return parsed.data;
        }
    } catch {
        // Storage can be blocked or hold junk: fall back to the defaults.
}
    return DEFAULT_RACE_SETTINGS;
}

// A pasted link works as well as a bare code.
const codeFrom = (raw: string): string => raw.trim().split('/').filter(Boolean).pop() ?? '';

function RacePage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const invite = params.get('with');

    const [settings, setSettings] = useState<RaceSettings>(loadSettings);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<{ message: string; code?: string } | null>(null);
    const [code, setCode] = useState('');
    const [joinError, setJoinError] = useState<string | null>(null);

    const changeSettings = (next: RaceSettings) => {
        setSettings(next);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Not saving is fine; the choice still applies to this race.
        }
    };

    const create = async () => {
        setCreating(true);
        setCreateError(null);
        const res = await raceCall<{ code: string; snapshot: RaceSnapshot; invite?: { ok: boolean; error?: string } }>('race:create', {
            settings,
            invite: invite ?? undefined,
        });
        setCreating(false);
        if (!res.ok) return setCreateError({ message: res.error, code: res.code });
        if (invite && res.invite) {
            if (res.invite.ok) toast.success(`Invited ${invite}`);
            else toast.error(`Couldn't invite ${invite}: ${res.invite.error}`);
        }
        navigate(`/race/${res.code}`);
    };

    const join = (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = raceCodeSchema.safeParse(codeFrom(code));
        if (!parsed.success) return setJoinError('Room codes are 6 letters or numbers.');
        navigate(`/race/${parsed.data}`);
    };

    if (loading) return <div className="route-loading"><Spinner size={20} /></div>;

    if (!user) {
        return (
            <div className="race-hub">
                <h1 className="page-title">Race</h1>
                <EmptyState
                    title="Log in to race"
                    action={<Button variant="primary" onClick={() => openAuthModal('login')}>Log in</Button>}
                >
                    Racing needs an account so your opponent knows who they're up against.
                </EmptyState>
            </div>
        );
    }

    return (
        <div className="race-hub">
            <header className="race-hub__head">
                <h1 className="page-title">Race</h1>
                <p className="race-hub__lede">Type the same text at the same time as a friend, and watch their caret as you go.</p>
            </header>

            <div className="race-hub__cols">
                <section className="race-hub__col" aria-labelledby="create-race">
                    <h2 className="rl-h" id="create-race">Create a race</h2>
                    {invite && (
                        <p className="race-hub__with">
                            Inviting <strong>{invite}</strong>
                            <button type="button" className="race-hub__clear" onClick={() => setParams({}, { replace: true })}>
                                Clear
                            </button>
                        </p>
                    )}
                    <RaceSettingsForm settings={settings} onChange={changeSettings} />
                    <div className="race-hub__actions">
                        <Button variant="primary" onClick={create} loading={creating}>Create race</Button>
                        {createError && (
                            <div className="ui-hint ui-hint--error" role="alert">
                                {createError.message}
                                {createError.code && (
                                    <>
                                        {' '}
                                        <button type="button" className="race-hub__clear" onClick={() => navigate(`/race/${createError.code}`)}>
                                            Go to it
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <section className="race-hub__col" aria-labelledby="join-race">
                    <h2 className="rl-h" id="quick-race">Quick match</h2>
                    <QuickMatch autoStart={params.get('quick') === '1'} />
                    <h2 className="rl-h" id="join-race">Join a race</h2>
                    <form className="race-hub__join" onSubmit={join}>
                        <Input
                            label="Room code"
                            placeholder="Room code or link"
                            value={code}
                            autoComplete="off"
                            spellCheck={false}
                            maxLength={80}
                            error={joinError}
                            hint="Ask the host for their 6-character code."
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase());
                                setJoinError(null);
                            }}
                        />
                        <Button type="submit" disabled={code.trim().length === 0}>Join</Button>
                    </form>
                </section>
            </div>
        </div>
    );
}

export default RacePage;
