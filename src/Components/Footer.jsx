import React, { useState } from 'react';
import Select from "react-select";
import { themeOptions } from '../Utils/themeOptions';
import { useTheme } from '../Context/ThemeContext';

function Footer() {
  const [value, setValue] = useState(themeOptions[0]); // Set default theme option
  const { setTheme } = useTheme();

  const handleChange = (e) => {
    setValue(e.value);
    setTheme(e.value);
  };

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: '#212121', // Dark background for the control
      border: '1px solid #444', // Slightly darker border color for contrast
      boxShadow: 'none',
      '&:hover': {
        border: '1px solid #666' // Darker border on hover
      },
      color: '#ffffff' // White text color for the control
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#ffffff' // White text color for selected value
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#212121', // Dark background for menu
      zIndex: 9999 // Ensures the menu appears above other elements
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#333333' : '#212121', // Dark background for options, lighter on hover
      color: '#ffffff' // White text color for options
    })
  };

  return (
    <div className='footer'>
      <div className="links">
        Links
      </div>
      <div className="themeButton">
        <Select
          value={value}
          onChange={handleChange}
          options={themeOptions}
          menuPlacement='top'
          styles={customStyles} // Add custom styles here
        />
      </div>
    </div>
  );
}

export default Footer;
