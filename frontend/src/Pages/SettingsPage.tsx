import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CARET_STYLES, FONT_SIZES, LANGUAGES, LIVE_STATS, SOUNDS, TEST_FONTS } from '@ciphersprint/shared';
import type { BlockedUser, Settings } from '@ciphersprint/shared';
import Segmented from '../Components/ui/Segmented';
import Switch from '../Components/ui/Switch';
import Button from '../Components/ui/Button';
import Input from '../Components/ui/Input';
import Dialog from '../Components/ui/Dialog';
import Avatar from '../Components/Avatar';
import ThemeGrid from '../Components/ThemeGrid';
import PasswordField from '../Components/PasswordField';
import { useSettings } from '../Context/SettingsContext';
import { useAuth } from '../Context/AuthContext';
import { useInstallPrompt } from '../Hooks/useInstallPrompt';
import { api } from '../Utils/api';
import { downloadBlob } from '../Utils/download';
import { playKeySound } from '../Utils/sound';
import { LANGUAGE_NAMES } from '../Utils/words';
import { openAuthModal } from '../Utils/authModal';
import { formatRelativeTime } from '../Utils/format';
import { cx } from '../Utils/cx';

const SECTIONS = [
    { id: 'typing', label: 'Typing' },
    { id: 'sound', label: 'Sound' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'account', label: 'Account' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'data', label: 'Data' },
] as const;

const FONT_LABELS: Record<Settings['testFont'], { label: string; family: string }> = {
    plex: { label: 'IBM Plex Mono', family: '"IBM Plex Mono", monospace' },
    jetbrains: { label: 'JetBrains Mono', family: '"JetBrains Mono", monospace' },
    roboto: { label: 'Roboto Mono', family: '"Roboto Mono", monospace' },
    fira: { label: 'Fira Code', family: '"Fira Code", monospace' },
};

function Row({ title, hint, children, id }: { title: string; hint?: string; children: React.ReactNode; id?: string }) {
    return (
        <div className="st-row" id={id}>
            <div className="st-row__text">
                <div className="st-row__title">{title}</div>
                {hint && <div className="st-row__hint">{hint}</div>}
            </div>
            <div className="st-row__control">{children}</div>
        </div>
    );
}

function Section({ id, title, children, note }: { id: string; title: string; children: React.ReactNode; note?: React.ReactNode }) {
    return (
        <section className="st-section" id={id} aria-labelledby={`${id}-title`}>
            <h2 className="st-title" id={`${id}-title`}>{title}</h2>
            {note && <p className="st-note">{note}</p>}
            {children}
        </section>
    );
}

function ChangePassword() {
    const { changePassword } = useAuth();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
            await changePassword(current, next);
            setCurrent('');
            setNext('');
            toast.success('Password changed. Other devices are signed out.');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <form className="st-form" onSubmit={submit}>
            <PasswordField label="Current password" placeholder="Current password" value={current} onChange={setCurrent} />
            <PasswordField label="New password" placeholder="New password" value={next} onChange={setNext} showRules autoComplete="new-password" />
            {error && <div className="ui-hint ui-hint--error" role="alert">{error}</div>}
            <div>
                <Button type="submit" loading={busy} disabled={!current || !next}>Change password</Button>
            </div>
        </form>
    );
}

function DeleteAccount() {
    const { user, deleteAccount } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [confirm, setConfirm] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    if (!user) return null;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await deleteAccount(confirm, user.hasPassword ? password : undefined);
            toast.info('Your account has been deleted.');
            navigate('/');
        } catch (err) {
            setError((err as Error).message);
            setBusy(false);
        }
    };

    return (
        <>
            <Row title="Delete account" hint="Removes your results, friends and messages. Group chats keep your messages as “deleted user”.">
                <Button variant="danger" icon="trash" onClick={() => setOpen(true)}>Delete account</Button>
            </Row>
            <Dialog open={open} onClose={() => !busy && setOpen(false)} title="Delete your account?" width={420} dismissible={!busy}>
                <form className="st-form" onSubmit={submit}>
                    <p className="st-note">This can't be undone. Type <strong>{user.username}</strong> to confirm.</p>
                    <Input label="Your username" placeholder={user.username} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
                    {user.hasPassword && <PasswordField label="Password" placeholder="Password" value={password} onChange={setPassword} />}
                    {error && <div className="ui-hint ui-hint--error" role="alert">{error}</div>}
                    <div className="ui-dialog__actions">
                        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Keep my account</Button>
                        <Button type="submit" variant="danger" loading={busy} disabled={confirm !== user.username || (user.hasPassword && !password)}>
                            Delete forever
                        </Button>
                    </div>
                </form>
            </Dialog>
        </>
    );
}

function BlockedList() {
    const [blocked, setBlocked] = useState<BlockedUser[] | null>(null);
    useEffect(() => {
        api.blocks().then((r) => setBlocked(r.blocked)).catch(() => setBlocked([]));
    }, []);
    const unblock = async (username: string) => {
        await api.unblock(username);
        setBlocked((b) => (b ?? []).filter((u) => u.username !== username));
        toast.success(`Unblocked ${username}`);
    };
    if (blocked === null) return <p className="st-note">Loading…</p>;
    if (blocked.length === 0) return <p className="st-note">You haven't blocked anyone.</p>;
    return (
        <ul className="st-blocked">
            {blocked.map((u) => (
                <li key={u.username}>
                    <Avatar url={u.avatarUrl} name={u.username} size="sm" />
                    <span className="st-blocked__name">{u.username}</span>
                    <span className="st-blocked__when">blocked {formatRelativeTime(u.blockedAt)}</span>
                    <Button size="sm" variant="ghost" onClick={() => unblock(u.username)}>Unblock</Button>
                </li>
            ))}
        </ul>
    );
}

function SettingsPage() {
    const { settings, update, reset, sync } = useSettings();
    const { user, updateVisibility, updatePresence } = useAuth();
    const install = useInstallPrompt();
    const [active, setActive] = useState<string>('typing');
    const [exporting, setExporting] = useState(false);

    // Highlight the section in view in the side index.
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { rootMargin: '-20% 0px -60% 0px' }
        );
        SECTIONS.forEach((s) => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [user]);

    const exportResults = async () => {
        setExporting(true);
        try {
            const { results } = await api.myResults(200);
            downloadBlob(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), results }, null, 2)], { type: 'application/json' }), 'ciphersprint-results.json');
        } catch (err) {
            toast.error(`Couldn't export: ${(err as Error).message}`);
        } finally {
            setExporting(false);
        }
    };

    const syncLabel = !user
        ? 'Saved in this browser. Log in to keep them on every device.'
        : sync === 'syncing'
          ? 'Saving to your account…'
          : sync === 'offline'
            ? "Saved here; your account will catch up when you're back online."
            : 'Synced to your account on every device.';

    return (
        <div className="st">
            <header className="st-head">
                <h1 className="page-title">Settings</h1>
                <p className={cx('st-sync', sync === 'synced' && 'is-synced')} role="status">
                    <span className="st-sync__dot" aria-hidden="true" />
                    {syncLabel}
                </p>
            </header>

            <div className="st-layout">
                <nav className="st-index" aria-label="Settings sections">
                    {SECTIONS.map((s) => (
                        <a key={s.id} href={`#${s.id}`} className={cx('st-index__link', active === s.id && 'is-active')}>
                            {s.label}
                        </a>
                    ))}
                </nav>

                <div className="st-body">
                    <Section id="typing" title="Typing">
                        <Row title="Caret" hint="How your caret looks in the test.">
                            <div className="st-caret-pick">
                                {CARET_STYLES.map((c) => (
                                    <button key={c} type="button" className={cx('st-caret-opt', settings.caretStyle === c && 'is-active')} aria-pressed={settings.caretStyle === c} onClick={() => update({ caretStyle: c })}>
                                        <span className={`st-caret-demo st-caret-demo--${c}`} aria-hidden="true">
                                            a<i />
                                        </span>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </Row>
                        <Row title="Smooth caret" hint="Glide between letters instead of jumping.">
                            <Switch label="Smooth caret" checked={settings.smoothCaret} onChange={(v) => update({ smoothCaret: v })} />
                        </Row>
                        <Row title="Live stats" hint="Shown next to the timer while you type.">
                            <Segmented label="Live stats" value={settings.liveStats} onChange={(v) => update({ liveStats: v })} options={LIVE_STATS.map((v) => ({ value: v, label: v === 'both' ? 'wpm + acc' : v }))} />
                        </Row>
                        <Row title="Text size">
                            <Segmented label="Text size" value={settings.fontSize} onChange={(v) => update({ fontSize: v })} options={FONT_SIZES.map((v) => ({ value: v, label: v.toUpperCase() }))} />
                        </Row>
                        <Row title="Test font" hint="The rest of the site stays in IBM Plex Mono.">
                            <div className="st-fonts">
                                {TEST_FONTS.map((f) => (
                                    <button key={f} type="button" className={cx('st-font', settings.testFont === f && 'is-active')} aria-pressed={settings.testFont === f} style={{ fontFamily: FONT_LABELS[f].family }} onClick={() => update({ testFont: f })}>
                                        <span className="st-font__sample">the quick fox</span>
                                        <span className="st-font__name">{FONT_LABELS[f].label}</span>
                                    </button>
                                ))}
                            </div>
                        </Row>
                        <Row title="Language" hint="For time and words tests. Personal bests are kept per language.">
                            <div className="st-langs">
                                {LANGUAGES.map((l) => (
                                    <button key={l} type="button" className={cx('mode-opt', settings.language === l && 'is-active')} aria-pressed={settings.language === l} onClick={() => update({ language: l })}>
                                        {LANGUAGE_NAMES[l]}
                                    </button>
                                ))}
                            </div>
                        </Row>
                        <Row title="Tab restarts" hint="Off: Tab moves to the restart button and Enter restarts.">
                            <Switch label="Tab restarts" checked={settings.tabRestart} onChange={(v) => update({ tabRestart: v })} />
                        </Row>
                        <Row title="Confidence mode" hint="Backspace is disabled. Every key counts.">
                            <Switch label="Confidence mode" checked={settings.confidence} onChange={(v) => update({ confidence: v })} />
                        </Row>
                    </Section>

                    <Section id="sound" title="Sound">
                        <Row title="Key sound" hint="Synthesised in your browser; nothing to download.">
                            <Segmented
                                label="Key sound"
                                value={settings.sound}
                                onChange={(v) => {
                                    update({ sound: v });
                                    playKeySound(v, settings.volume);
                                }}
                                options={SOUNDS.map((v) => ({ value: v, label: v }))}
                            />
                        </Row>
                        <Row title="Volume">
                            <input
                                className="st-range"
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={settings.volume}
                                aria-label="Volume"
                                disabled={settings.sound === 'off'}
                                onChange={(e) => update({ volume: Number(e.target.value) })}
                                onPointerUp={() => playKeySound(settings.sound, settings.volume)}
                            />
                        </Row>
                        <Row title="Error sound" hint="A low buzz on a wrong key.">
                            <Switch label="Error sound" checked={settings.errorSound} disabled={settings.sound === 'off'} onChange={(v) => update({ errorSound: v })} />
                        </Row>
                    </Section>

                    <Section id="appearance" title="Appearance">
                        <Row title="Decrypt animation" hint="New text decodes into place. Off when your system asks for less motion.">
                            <Switch label="Decrypt animation" checked={settings.decrypt} onChange={(v) => update({ decrypt: v })} />
                        </Row>
                        <div className="st-themes">
                            <div className="st-row__title">Theme</div>
                            <ThemeGrid />
                        </div>
                    </Section>

                    <Section id="account" title="Account" note={!user ? undefined : `Signed in as ${user.username} (${user.email}).`}>
                        {!user ? (
                            <Row title="Not signed in" hint="An account keeps your results, friends and settings everywhere.">
                                <Button variant="primary" onClick={() => openAuthModal('signup')}>Create account</Button>
                            </Row>
                        ) : (
                            <>
                                {user.hasPassword ? (
                                    <div className="st-block">
                                        <div className="st-row__title">Password</div>
                                        <ChangePassword />
                                    </div>
                                ) : (
                                    <Row title="Password" hint="You sign in with Google. To add a password, use “Forgot password” on the login screen." >
                                        <span className="st-note">Google sign-in</span>
                                    </Row>
                                )}
                                <DeleteAccount />
                            </>
                        )}
                    </Section>

                    <Section id="privacy" title="Privacy">
                        {user ? (
                            <>
                                <Row title="Public profile" hint="Anyone can see your stats and race record.">
                                    <Switch label="Public profile" checked={user.isPublic} onChange={(v) => updateVisibility(v).catch((e: Error) => toast.error(e.message))} />
                                </Row>
                                <Row title="Show online status" hint="Friends see a dot when you're here.">
                                    <Switch label="Show online status" checked={user.showPresence} onChange={(v) => updatePresence(v).catch((e: Error) => toast.error(e.message))} />
                                </Row>
                                <div className="st-block">
                                    <div className="st-row__title">Blocked people</div>
                                    <div className="st-row__hint">They can't find you, message you, add you or invite you to a race.</div>
                                    <BlockedList />
                                </div>
                            </>
                        ) : (
                            <p className="st-note">Privacy settings apply to accounts.</p>
                        )}
                    </Section>

                    <Section id="data" title="Data">
                        {user && (
                            <Row title="Export results" hint="Your last 200 tests as JSON.">
                                <Button icon="download" onClick={exportResults} loading={exporting}>Export</Button>
                            </Row>
                        )}
                        <Row
                            title="Install app"
                            hint={
                                install.installed
                                    ? 'Installed. It opens in its own window and works offline.'
                                    : install.canInstall
                                      ? 'Opens in its own window and runs the typing test offline.'
                                      : 'Your browser installs it from its own menu: the install icon in the address bar in Chrome or Edge, or Share → Add to Dock in Safari.'
                            }
                        >
                            {install.installed ? (
                                <span className="st-note">Installed</span>
                            ) : install.canInstall ? (
                                <Button icon="download" onClick={install.prompt}>Install</Button>
                            ) : null}
                        </Row>
                        <Row title="Reset settings" hint="Back to the defaults. Your theme stays.">
                            <Button variant="ghost" onClick={() => { reset(); toast.info('Settings reset.'); }}>Reset</Button>
                        </Row>
                    </Section>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;
