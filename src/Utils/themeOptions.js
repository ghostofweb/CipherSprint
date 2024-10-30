const darkTheme = {
    label: 'Dark',
    background: '#121212', // A softer black for better eye comfort
    textColor: '#ffffff',
    typeBoxColor: '#e0e0e0' // Light gray for text in type box
  };
  
  const redTheme = {
    label: 'Red',
    background: '#ffcccb', // Light red for background
    textColor: '#8b0000', // Dark red for text
    typeBoxColor: '#8b0000' // Dark red for text in type box
  };
  
  const lightTheme = {
    label: 'Light',
    background: '#ffffff',
    textColor: '#000000',
    typeBoxColor: '#333333' // Dark text in type box
  };
  
  const oceanTheme = {
    label: 'Ocean',
    background: '#0077b6',
    textColor: '#caf0f8',
    typeBoxColor: '#005f73' // Darker text in type box
  };
  
  const forestTheme = {
    label: 'Forest',
    background: '#2b2a2a',
    textColor: '#8ecae6',
    typeBoxColor: '#f1faee' // Light text in type box
  };
  
  const pastelTheme = {
    label: 'Pastel',
    background: '#f0e5de',
    textColor: '#7d5a5a',
    typeBoxColor: '#7d5a5a'
  };
  
  const darkModeAlternative = {
    label: 'Midnight',
    background: '#1a1a40',
    textColor: '#d1d1d1',
    typeBoxColor: '#d1d1d1'
  };
  
  const solarizedTheme = {
    label: 'Solarized',
    background: '#fdf6e3',
    textColor: '#657b83',
    typeBoxColor: '#586e75' // Darker text in type box
  };
  
  export const themeOptions = [
    { label: "Dark", value: darkTheme },
    { label: "Red", value: redTheme },
    { label: "Light", value: lightTheme },
    { label: "Ocean", value: oceanTheme },
    { label: "Forest", value: forestTheme },
    { label: "Pastel", value: pastelTheme },
    { label: "Midnight", value: darkModeAlternative },
    { label: "Solarized", value: solarizedTheme }
  ];
  