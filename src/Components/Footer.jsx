import React, { useState } from 'react';
import Select from "react-select";
import { themeOptions } from '../Utils/themeOptions';
import { GitHubIcon, LinkedInIcon } from './SocialIcons'; // Adjust the path if needed
import { useTheme } from '../Context/ThemeContext';

function Footer() {
  const [value, setValue] = useState();
  const { theme, setTheme } = useTheme(); // Correctly destructure theme and setTheme from useTheme

  const handleChange = (e) => {
    setTheme(e.value);
    localStorage.setItem("theme", JSON.stringify(e.value));
  };

  return (
    <div className="footer" style={{ maxWidth: '2000px' }}>
      <div className="footer-left" style={{ color: theme.textColor }}>
        © {new Date().getFullYear()} MonkeyFight
      </div>
      <div className="footer-right" style={{ display: 'flex', alignItems: 'center' }}>
        <a 
          href="https://github.com/ghostofweb" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ color: theme.textColor, display: 'flex', alignItems: 'center', marginRight: '10px' }}
        >
          <GitHubIcon fill={theme.textColor} />
          <span style={{ marginLeft: '5px' }}>Github</span>
        </a>
        <a 
          href="https://linkedin.com/in/sahiljeet-singh-kalsi-085844244/" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ color: theme.textColor, display: 'flex', alignItems: 'center' }}
        >
          <LinkedInIcon fill={theme.textColor} />
          <span style={{ marginLeft: '5px' }}>Linkedin</span>
        </a>
        <Select
          value={value}
          onChange={(selectedOption) => {
            setValue(selectedOption);
            handleChange(selectedOption);
          }}
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
          defaultValue={themeOptions.find(option => option.value === theme)} // Set the default value based on the current theme
          className="theme-select"
        />
      </div>
    </div>
  );
}

export default Footer;
