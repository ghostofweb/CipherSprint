import React from 'react';
import Icon from './ui/Icon';
import { GitHubIcon, LinkedInIcon } from './SocialIcons';
import { useTheme } from '../Context/ThemeContext';

interface FooterProps {
  hidden?: boolean;
  onOpenThemePicker: () => void;
}

function Footer({ hidden, onOpenThemePicker }: FooterProps) {
  const { theme } = useTheme();

  return (
    <footer className={`site-footer${hidden ? ' chrome-hidden' : ''}`}>
      <div className="footer-left">© {new Date().getFullYear()} CipherSprint</div>
      <div className="footer-right">
        <a href="https://github.com/ghostofweb" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <GitHubIcon fill="currentColor" width={16} height={16} />
        </a>
        <a href="https://linkedin.com/in/sahiljeet-singh-kalsi-085844244/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <LinkedInIcon fill="currentColor" width={16} height={16} />
        </a>
        <button type="button" className="theme-picker-trigger" onClick={onOpenThemePicker}>
          <Icon name="contrast" size={16} />
          {theme.label}
        </button>
      </div>
    </footer>
  );
}

export default Footer;
