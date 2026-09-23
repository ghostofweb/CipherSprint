import React from 'react';
import Icon from './ui/Icon';
import { GitHubIcon, LinkedInIcon } from './SocialIcons';
import { useTheme } from '../Context/ThemeContext';
import { useUi } from '../Context/UiContext';

interface FooterProps {
  hidden?: boolean;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

function Footer({ hidden }: FooterProps) {
  const { theme } = useTheme();
  const { openThemePicker, openPalette, openShortcuts } = useUi();

  return (
    <footer className={`site-footer${hidden ? ' chrome-hidden' : ''}`}>
      {/* The two keys worth knowing, where people look for them. */}
      <div className="footer-keys">
        <button type="button" className="footer-key" onClick={openPalette}>
          <kbd>{isMac ? '⌘' : 'ctrl'}</kbd>+<kbd>k</kbd> commands
        </button>
        <span className="footer-key"><kbd>esc</kbd> restart</span>
        <button type="button" className="footer-key" onClick={openShortcuts}>
          <kbd>?</kbd> shortcuts
        </button>
      </div>
      <div className="footer-right">
        <span className="footer-copy">© {new Date().getFullYear()} CipherSprint</span>
        <a href="https://github.com/ghostofweb" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <GitHubIcon fill="currentColor" width={16} height={16} />
        </a>
        <a href="https://linkedin.com/in/sahiljeet-singh-kalsi-085844244/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <LinkedInIcon fill="currentColor" width={16} height={16} />
        </a>
        <button type="button" className="theme-picker-trigger" onClick={openThemePicker}>
          <Icon name="contrast" size={16} />
          {theme.label}
        </button>
      </div>
    </footer>
  );
}

export default Footer;
