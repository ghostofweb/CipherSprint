const darkTheme = {
  label: 'Dark',
  background: '#121212', // A softer black for better eye comfort
  textColor: '#ffffff',
  typeBoxColor: '#e0e0e0', // Light gray for text in type box
  headerBackgroundColor: '#0f0f0f', // Darker version of the background
  correctWordColor: '#76ff03', // Light green for correct words
  incorrectWordColor: '#ff3d00', // Bright orange for incorrect words
  wordColor: '#ffffff' // White for general words
};

const redTheme = {
  label: 'Pink',
  background: '#ffcccb', // Light red for background
  textColor: '#8b0000', // Dark red for text
  typeBoxColor: '#8b0000', // Dark red for text in type box
  headerBackgroundColor: '#ffb2b2', // Slightly darker light red
  correctWordColor: '#00e676', // Light green for correct words
  incorrectWordColor: '#ff1744', // Bright red for incorrect words
  wordColor: '#8b0000' // Dark red for general words
};

const lightTheme = {
  label: 'Light',
  background: '#ffffff',
  textColor: '#000000',
  typeBoxColor: '#333333', // Dark text in type box
  headerBackgroundColor: '#e0e0e0', // Light gray for headers
  correctWordColor: '#4caf50', // Green for correct words
  incorrectWordColor: '#f44336', // Red for incorrect words
  wordColor: '#000000' // Black for general words
};

const oceanTheme = {
  label: 'Ocean',
  background: '#0077b6',
  textColor: '#caf0f8',
  typeBoxColor: '#005f73', // Darker text in type box
  headerBackgroundColor: '#005b8a', // Darker ocean blue
  correctWordColor: '#90e0ef', // Light blue for correct words
  incorrectWordColor: '#ff6b6b', // Coral for incorrect words
  wordColor: '#caf0f8' // Light blue for general words
};

const forestTheme = {
  label: 'Forest',
  background: '#2b2a2a',
  textColor: '#8ecae6',
  typeBoxColor: '#f1faee', // Light text in type box
  headerBackgroundColor: '#242424', // Darker forest background
  correctWordColor: '#4caf50', // Green for correct words
  incorrectWordColor: '#ff3d00', // Bright orange for incorrect words
  wordColor: '#8ecae6' // Light blue for general words
};

const pastelTheme = {
  label: 'Pastel',
  background: '#f0e5de',
  textColor: '#7d5a5a',
  typeBoxColor: '#7d5a5a',
  headerBackgroundColor: '#e1c4c2', // Darker pastel pink
  correctWordColor: '#76ff03', // Light green for correct words
  incorrectWordColor: '#ff4081', // Pink for incorrect words
  wordColor: '#7d5a5a' // Dark pastel for general words
};

const darkModeAlternative = {
  label: 'Midnight',
  background: '#1a1a40',
  textColor: '#d1d1d1',
  typeBoxColor: '#d1d1d1',
  headerBackgroundColor: '#15153a', // Darker midnight blue
  correctWordColor: '#4caf50', // Green for correct words
  incorrectWordColor: '#ff3d00', // Bright orange for incorrect words
  wordColor: '#d1d1d1' // Light gray for general words
};

const solarizedTheme = {
  label: 'Solarized',
  background: '#fdf6e3',
  textColor: '#657b83',
  typeBoxColor: '#586e75', // Darker text in type box
  headerBackgroundColor: '#e4d8c7', // Darker solarized background
  correctWordColor: '#859900', // Olive green for correct words
  incorrectWordColor: '#dc322f', // Red for incorrect words
  wordColor: '#657b83' // Darker solarized for general words
};

const emeraldTheme = {
  label: 'Emerald',
  background: '#064e3b',
  textColor: '#d1fae5',
  typeBoxColor: '#10b981',
  headerBackgroundColor: '#053c2b', // Darker emerald green
  correctWordColor: '#2ddf6f', // Bright green for correct words
  incorrectWordColor: '#ff1744', // Bright red for incorrect words
  wordColor: '#d1fae5' // Light green for general words
};

const sakuraTheme = {
  label: 'Sakura',
  background: '#fff1f2',
  textColor: '#5c0029',
  typeBoxColor: '#ffc1cc',
  headerBackgroundColor: '#ffd1d5', // Darker sakura pink
  correctWordColor: '#d81b60', // Pink for correct words
  incorrectWordColor: '#ff6f61', // Coral for incorrect words
  wordColor: '#5c0029' // Dark red for general words
};

const lavenderTheme = {
  label: 'Lavender',
  background: '#e6e6fa',
  textColor: '#4b0082',
  typeBoxColor: '#b0a7d3',
  headerBackgroundColor: '#d6d6e8', // Darker lavender
  correctWordColor: '#8e44ad', // Purple for correct words
  incorrectWordColor: '#e74c3c', // Bright red for incorrect words
  wordColor: '#4b0082' // Indigo for general words
};

const desertSunsetTheme = {
  label: 'Desert Sunset',
  background: '#fed9b7',
  textColor: '#ef233c',
  typeBoxColor: '#ff6f59',
  headerBackgroundColor: '#fdb59c', // Darker desert sunset
  correctWordColor: '#ffcc00', // Yellow for correct words
  incorrectWordColor: '#e63946', // Bright red for incorrect words
  wordColor: '#ef233c' // Bright red for general words
};

const monochromeTheme = {
  label: 'Monochrome',
  background: '#333333',
  textColor: '#e0e0e0',
  typeBoxColor: '#4d4d4d',
  headerBackgroundColor: '#2b2b2b', // Darker monochrome
  correctWordColor: '#ffffff', // White for correct words
  incorrectWordColor: '#ff3d00', // Bright orange for incorrect words
  wordColor: '#e0e0e0' // Light gray for general words
};

const sunriseTheme = {
  label: 'Sunrise',
  background: '#ffedd5',
  textColor: '#d97706',
  typeBoxColor: '#f59e0b',
  headerBackgroundColor: '#ffd8b7', // Darker sunrise
  correctWordColor: '#ffcc00', // Yellow for correct words
  incorrectWordColor: '#e63946', // Bright red for incorrect words
  wordColor: '#d97706' // Dark orange for general words
};

const celestialTheme = {
  label: 'Celestial',
  background: '#1e1e30',
  textColor: '#a6b1e1',
  typeBoxColor: '#3f3f74',
  headerBackgroundColor: '#161620', // Darker celestial
  correctWordColor: '#76ff03', // Light green for correct words
  incorrectWordColor: '#ff6b6b', // Coral for incorrect words
  wordColor: '#a6b1e1' // Light purple for general words
};

const mintTheme = {
  label: 'Mint',
  background: '#eff7f6',
  textColor: '#2b7a78',
  typeBoxColor: '#76c7c0',
  headerBackgroundColor: '#d7efec', // Darker mint
  correctWordColor: '#48c774', // Mint green for correct words
  incorrectWordColor: '#ff3860', // Bright red for incorrect words
  wordColor: '#2b7a78' // Dark mint for general words
};

const rusticTheme = {
  label: 'Rustic',
  background: '#ede0d4',
  textColor: '#cb997e',
  typeBoxColor: '#ddbea9',
  headerBackgroundColor: '#d7c8b9', // Darker rustic
  correctWordColor: '#d8b25b', // Gold for correct words
  incorrectWordColor: '#c0342d', // Brick red for incorrect words
  wordColor: '#cb997e' // Brown for general words
};

const cyberpunkTheme = {
  label: 'Cyberpunk',
  background: '#0a192f',
  textColor:'#64ffda',
  typeBoxColor: '#32ff7e',
  headerBackgroundColor: '#1e1f26', // Darker cyberpunk
  correctWordColor: '#ff007c', // Bright pink for correct words
  incorrectWordColor: '#ff4c4c', // Bright red for incorrect words
  wordColor: '#64ffda' // Light teal for general words
};

export const themeOptions = [
  { label: "Dark", value: darkTheme },
  { label: "Pink", value: redTheme },
  { label: "Light", value: lightTheme },
  { label: "Ocean", value: oceanTheme },
  { label: "Forest", value: forestTheme },
  { label: "Pastel", value: pastelTheme },
  { label: "Midnight", value: darkModeAlternative },
  { label: "Solarized", value: solarizedTheme },
  { label: "Emerald", value: emeraldTheme },
  { label: "Sakura", value: sakuraTheme },
  { label: "Lavender", value: lavenderTheme },
  { label: "Desert Sunset", value: desertSunsetTheme },
  { label: "Monochrome", value: monochromeTheme },
  { label: "Sunrise", value: sunriseTheme },
  { label: "Celestial", value: celestialTheme },
  { label: "Mint", value: mintTheme },
  { label: "Rustic", value: rusticTheme },
  { label: "Cyberpunk", value: cyberpunkTheme },
];
