import React, { useState } from 'react';
import Select from "react-select";
import { themeOptions } from '../Utils/themeOptions';
import { useTheme } from '../Context/ThemeContext';

function Footer() {
  const [value, setValue] = useState();
  const { setTheme, theme } = useTheme();

  const handleChange = (e) => {
    setTheme(e.value);
    localStorage.setItem("theme", JSON.stringify(e.value));
  };

  return (
    <div className="footer" style={{ maxWidth: '2000px' }}>
      <div className="footer-left" style={{ color: theme.textColor }}>
        © {new Date().getFullYear()} MonkeyFight
      </div>
      <div className="footer-right">
        <a href="https://github.com/ghostofweb" target="_blank" rel="noopener noreferrer">
          <img src="/github.svg" alt="GitHub" className="footer-icon" />
          GitHub
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
          <img src="/linkedin.svg" alt="LinkedIn" className="footer-icon" />
        </a>
        <Select
          value={value}
          onChange={handleChange}
          options={themeOptions}
          menuPlacement='top'
          styles={{
            control: (styles) => ({ ...styles, backgroundColor: theme.background }),
            menu: (styles) => ({ ...styles, backgroundColor: theme.background }),
            option: (styles, { isFocused }) => ({
              ...styles,
              backgroundColor: isFocused ? theme.background : theme.textColor,
              color: isFocused ? theme.textColor : theme.background,
              cursor: "pointer",
            }),
          }}
          defaultValue={{ label: theme.label, value: theme }}
          className="theme-select"
        />
      </div>
    </div>
  );
}

export default Footer;
