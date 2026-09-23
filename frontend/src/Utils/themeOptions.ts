// Curated from MonkeyType's real, community-vetted theme collection
// (frontend/src/ts/constants/themes.ts) -- adapted to this app's token
// shape. Each theme follows the same convention MonkeyType itself uses:
// a correctly-typed character is the theme's normal bright text color,
// and an untyped word is the muted sub-text color. A handful of entries
// have manually-adjusted sub/error/caret values where MonkeyType's raw
// numbers read poorly against a single full-page background in our
// simpler (no secondary "subAlt" layer) theme system -- verified with a
// WCAG contrast pass so untyped words, errors, and the caret stay legible
// in every theme.

export interface Theme {
  label: string;
  background: string;
  textColor: string;
  subTextColor: string;
  wordColor: string;
  correctWordColor: string;
  incorrectWordColor: string;
  cursorColor: string;
}

// CipherSprint's own palettes. Amber on graphite comes from typing
// hardware (teletypes, amber-phosphor terminals), not from an editor theme.
const cipherTheme: Theme = {
  label: 'Cipher',
  background: '#17181b',
  textColor: '#e9e4d8',
  subTextColor: '#75716a',
  wordColor: '#75716a',
  correctWordColor: '#e9e4d8',
  incorrectWordColor: '#e0554c',
  cursorColor: '#f0a63a',
};

const cipherPaperTheme: Theme = {
  label: 'Cipher Paper',
  background: '#e7e8e4',
  textColor: '#1c2024',
  subTextColor: '#80857f',
  wordColor: '#80857f',
  correctWordColor: '#1c2024',
  incorrectWordColor: '#c2362d',
  cursorColor: '#a85f00',
};

const draculaTheme: Theme = {
  label: 'Dracula',
  background: '#282a36',
  textColor: '#f8f8f2',
  subTextColor: '#6272a4',
  wordColor: '#6272a4',
  correctWordColor: '#f8f8f2',
  incorrectWordColor: '#ff5555',
  cursorColor: '#bd93f9',
};

const nordTheme: Theme = {
  label: 'Nord',
  background: '#242933',
  textColor: '#d8dee9',
  subTextColor: '#929aaa',
  wordColor: '#929aaa',
  correctWordColor: '#d8dee9',
  incorrectWordColor: '#bf616a',
  cursorColor: '#eceff4',
};

const gruvboxDarkTheme: Theme = {
  label: 'Gruvbox Dark',
  background: '#282828',
  textColor: '#ebdbb2',
  subTextColor: '#665c54',
  wordColor: '#665c54',
  correctWordColor: '#ebdbb2',
  incorrectWordColor: '#fb4934',
  cursorColor: '#fabd2f',
};

const monokaiTheme: Theme = {
  label: 'Monokai',
  background: '#272822',
  textColor: '#e2e2dc',
  subTextColor: '#e6db74',
  wordColor: '#e6db74',
  correctWordColor: '#e2e2dc',
  incorrectWordColor: '#f92672',
  cursorColor: '#66d9ef',
};

const oneDarkTheme: Theme = {
  label: 'One Dark',
  background: '#2f343f',
  textColor: '#98c379',
  subTextColor: '#5c6370',
  wordColor: '#5c6370',
  correctWordColor: '#98c379',
  incorrectWordColor: '#e06c75',
  cursorColor: '#61afef',
};

const catppuccinTheme: Theme = {
  label: 'Catppuccin',
  background: '#1e1e2e',
  textColor: '#cdd6f4',
  subTextColor: '#7f849c',
  wordColor: '#7f849c',
  correctWordColor: '#cdd6f4',
  incorrectWordColor: '#f38ba8',
  cursorColor: '#f2cdcd',
};

const rosePineTheme: Theme = {
  label: 'Rose Pine',
  background: '#1f1d27',
  textColor: '#e0def4',
  subTextColor: '#c4a7e7',
  wordColor: '#c4a7e7',
  correctWordColor: '#e0def4',
  incorrectWordColor: '#eb6f92',
  cursorColor: '#f6c177',
};

const rosePineMoonTheme: Theme = {
  label: 'Rose Pine Moon',
  background: '#2a273f',
  textColor: '#e0def4',
  subTextColor: '#c4a7e7',
  wordColor: '#c4a7e7',
  correctWordColor: '#e0def4',
  incorrectWordColor: '#eb6f92',
  cursorColor: '#f6c177',
};

const solarizedDarkTheme: Theme = {
  label: 'Solarized Dark',
  background: '#002b36',
  textColor: '#268bd2',
  subTextColor: '#657b83',
  wordColor: '#657b83',
  correctWordColor: '#268bd2',
  incorrectWordColor: '#d33682',
  cursorColor: '#dc322f',
};

const icebergDarkTheme: Theme = {
  label: 'Iceberg Dark',
  background: '#161821',
  textColor: '#c6c8d1',
  subTextColor: '#595e76',
  wordColor: '#595e76',
  correctWordColor: '#c6c8d1',
  incorrectWordColor: '#e27878',
  cursorColor: '#d2d4de',
};

const everblushTheme: Theme = {
  label: 'Everblush',
  background: '#141b1e',
  textColor: '#dadada',
  subTextColor: '#838887',
  wordColor: '#838887',
  correctWordColor: '#dadada',
  incorrectWordColor: '#e57474',
  cursorColor: '#6cbfbf',
};

const horizonTheme: Theme = {
  label: 'Horizon',
  background: '#1c1e26',
  textColor: '#bbbbbb',
  subTextColor: '#db886f',
  wordColor: '#db886f',
  correctWordColor: '#bbbbbb',
  incorrectWordColor: '#d55170',
  cursorColor: '#bbbbbb',
};

const serikaDarkTheme: Theme = {
  label: 'Serika Dark',
  background: '#323437',
  textColor: '#d1d0c5',
  subTextColor: '#646669',
  wordColor: '#646669',
  correctWordColor: '#d1d0c5',
  incorrectWordColor: '#ca4754',
  cursorColor: '#e2b714',
};

const vsCodeTheme: Theme = {
  label: 'VS Code',
  background: '#1e1e1e',
  textColor: '#d4d4d4',
  subTextColor: '#4d4d4d',
  wordColor: '#4d4d4d',
  correctWordColor: '#d4d4d4',
  incorrectWordColor: '#f44747',
  cursorColor: '#569cd6',
};

const gitHubTheme: Theme = {
  label: 'GitHub',
  background: '#212830',
  textColor: '#ccdae6',
  subTextColor: '#788386',
  wordColor: '#788386',
  correctWordColor: '#ccdae6',
  incorrectWordColor: '#c23e3a',
  cursorColor: '#41ce5c',
};

const materialTheme: Theme = {
  label: 'Material',
  background: '#263238',
  textColor: '#e6edf3',
  subTextColor: '#4c6772',
  wordColor: '#4c6772',
  correctWordColor: '#e6edf3',
  incorrectWordColor: '#fb4934',
  cursorColor: '#80cbc4',
};

const discordTheme: Theme = {
  label: 'Discord',
  background: '#313338',
  textColor: '#dcdee3',
  subTextColor: '#949ba4',
  wordColor: '#949ba4',
  correctWordColor: '#dcdee3',
  incorrectWordColor: '#df4f4b',
  cursorColor: '#5a65ea',
};

const sonokaiTheme: Theme = {
  label: 'Sonokai',
  background: '#2c2e34',
  textColor: '#e2e2e3',
  subTextColor: '#e7c664',
  wordColor: '#e7c664',
  correctWordColor: '#e2e2e3',
  incorrectWordColor: '#fc5d7c',
  cursorColor: '#f38c71',
};

const phantomTheme: Theme = {
  label: 'Phantom',
  background: '#000011',
  textColor: '#c0caf5',
  subTextColor: '#414868',
  wordColor: '#414868',
  correctWordColor: '#c0caf5',
  incorrectWordColor: '#f7768e',
  cursorColor: '#bb9af7',
};

const auroraTheme: Theme = {
  label: 'Aurora',
  background: '#011926',
  textColor: '#ffffff',
  subTextColor: '#245c69',
  wordColor: '#245c69',
  correctWordColor: '#ffffff',
  incorrectWordColor: '#b94da1',
  cursorColor: '#00e980',
};

const matrixTheme: Theme = {
  label: 'Matrix',
  background: '#000000',
  textColor: '#d1ffcd',
  subTextColor: '#006500',
  wordColor: '#006500',
  correctWordColor: '#d1ffcd',
  incorrectWordColor: '#da3333',
  cursorColor: '#15ff00',
};

const vesperTheme: Theme = {
  label: 'Vesper',
  background: '#101010',
  textColor: '#ffffff',
  subTextColor: '#a0a0a0',
  wordColor: '#a0a0a0',
  correctWordColor: '#ffffff',
  incorrectWordColor: '#ff8080',
  cursorColor: '#99ffe4',
};

const reposeDarkTheme: Theme = {
  label: 'Repose Dark',
  background: '#2f3338',
  textColor: '#d6d2bc',
  subTextColor: '#8f8e84',
  wordColor: '#8f8e84',
  correctWordColor: '#d6d2bc',
  incorrectWordColor: '#ff4a59',
  cursorColor: '#d6d2bc',
};

const modernDolchTheme: Theme = {
  label: 'Modern Dolch',
  background: '#2d2e30',
  textColor: '#e3e6eb',
  subTextColor: '#54585c',
  wordColor: '#54585c',
  correctWordColor: '#e3e6eb',
  incorrectWordColor: '#d36a7b',
  cursorColor: '#7eddd3',
};

const blueberryDarkTheme: Theme = {
  label: 'Blueberry Dark',
  background: '#212b42',
  textColor: '#91b4d5',
  subTextColor: '#5c7da5',
  wordColor: '#5c7da5',
  correctWordColor: '#91b4d5',
  incorrectWordColor: '#df4576',
  cursorColor: '#962f7e',
};

const cherryBlossomTheme: Theme = {
  label: 'Cherry Blossom',
  background: '#323437',
  textColor: '#d1d0c5',
  subTextColor: '#787d82',
  wordColor: '#787d82',
  correctWordColor: '#d1d0c5',
  incorrectWordColor: '#ca4754',
  cursorColor: '#ffffff',
};

const midnightTheme: Theme = {
  label: 'Midnight',
  background: '#0b0e13',
  textColor: '#9fadc6',
  subTextColor: '#394760',
  wordColor: '#394760',
  correctWordColor: '#9fadc6',
  incorrectWordColor: '#c27070',
  cursorColor: '#60759f',
};

const terraTheme: Theme = {
  label: 'Terra',
  background: '#0c100e',
  textColor: '#f0edd1',
  subTextColor: '#436029',
  wordColor: '#436029',
  correctWordColor: '#f0edd1',
  incorrectWordColor: '#d3ca78',
  cursorColor: '#89c559',
};

const watermelonTheme: Theme = {
  label: 'Watermelon',
  background: '#1f4437',
  textColor: '#cdc6bc',
  subTextColor: '#3e7a65',
  wordColor: '#3e7a65',
  correctWordColor: '#cdc6bc',
  incorrectWordColor: '#ff5f5f',
  cursorColor: '#d6686f',
};

const gruvboxLightTheme: Theme = {
  label: 'Gruvbox Light',
  background: '#fbf1c7',
  textColor: '#3c3836',
  subTextColor: '#a89984',
  wordColor: '#a89984',
  correctWordColor: '#3c3836',
  incorrectWordColor: '#cc241d',
  cursorColor: '#689d6a',
};

const solarizedLightTheme: Theme = {
  label: 'Solarized Light',
  background: '#fdf6e3',
  textColor: '#181819',
  subTextColor: '#2aa198',
  wordColor: '#2aa198',
  correctWordColor: '#181819',
  incorrectWordColor: '#d33682',
  cursorColor: '#dc322f',
};

const icebergLightTheme: Theme = {
  label: 'Iceberg Light',
  background: '#e8e9ec',
  textColor: '#33374c',
  subTextColor: '#7d84a3',
  wordColor: '#7d84a3',
  correctWordColor: '#33374c',
  incorrectWordColor: '#cc517a',
  cursorColor: '#262a3f',
};

const paperTheme: Theme = {
  label: 'Paper',
  background: '#eeeeee',
  textColor: '#444444',
  subTextColor: '#b2b2b2',
  wordColor: '#b2b2b2',
  correctWordColor: '#444444',
  incorrectWordColor: '#d70000',
  cursorColor: '#444444',
};

const serikaTheme: Theme = {
  label: 'Serika',
  background: '#e1e1e3',
  textColor: '#323437',
  subTextColor: '#75787c',
  wordColor: '#75787c',
  correctWordColor: '#323437',
  incorrectWordColor: '#da3333',
  cursorColor: '#b8930a',
};

const nordLightTheme: Theme = {
  label: 'Nord Light',
  background: '#eceff4',
  textColor: '#2e3440',
  subTextColor: '#4c566a',
  wordColor: '#4c566a',
  correctWordColor: '#2e3440',
  incorrectWordColor: '#bf616a',
  cursorColor: '#5e81ac',
};

const rosePineDawnTheme: Theme = {
  label: 'Rose Pine Dawn',
  background: '#fffaf3',
  textColor: '#286983',
  subTextColor: '#c4a7e7',
  wordColor: '#c4a7e7',
  correctWordColor: '#286983',
  incorrectWordColor: '#b4637a',
  cursorColor: '#ea9d34',
};

const reposeLightTheme: Theme = {
  label: 'Repose Light',
  background: '#efead0',
  textColor: '#333538',
  subTextColor: '#8f8e84',
  wordColor: '#8f8e84',
  correctWordColor: '#333538',
  incorrectWordColor: '#c43c53',
  cursorColor: '#5f605e',
};

const campingTheme: Theme = {
  label: 'Camping',
  background: '#faf1e4',
  textColor: '#3c403b',
  subTextColor: '#8c8272',
  wordColor: '#8c8272',
  correctWordColor: '#3c403b',
  incorrectWordColor: '#ad4f4e',
  cursorColor: '#618c56',
};

const desertOasisTheme: Theme = {
  label: 'Desert Oasis',
  background: '#fff2d5',
  textColor: '#332800',
  subTextColor: '#0061fe',
  wordColor: '#0061fe',
  correctWordColor: '#332800',
  incorrectWordColor: '#c1443a',
  cursorColor: '#3a87fe',
};

const mizuTheme: Theme = {
  label: 'Mizu',
  background: '#afcbdd',
  textColor: '#1a2633',
  subTextColor: '#5c7a91',
  wordColor: '#5c7a91',
  correctWordColor: '#1a2633',
  incorrectWordColor: '#a83f4a',
  cursorColor: '#1a2633',
};

const botanicalTheme: Theme = {
  label: 'Botanical',
  background: '#1e2b28',
  textColor: '#eaf1f3',
  subTextColor: '#495755',
  wordColor: '#495755',
  correctWordColor: '#eaf1f3',
  incorrectWordColor: '#e2574c',
  cursorColor: '#abc6c4',
};

const lavenderTheme: Theme = {
  label: 'Lavender',
  background: '#ada6c2',
  textColor: '#2f2a41',
  subTextColor: '#e4e3e9',
  wordColor: '#e4e3e9',
  correctWordColor: '#2f2a41',
  incorrectWordColor: '#7a1f2e',
  cursorColor: '#e4e3e9',
};

const peachesTheme: Theme = {
  label: 'Peaches',
  background: '#e0d7c1',
  textColor: '#5f4c41',
  subTextColor: '#9c8060',
  wordColor: '#9c8060',
  correctWordColor: '#5f4c41',
  incorrectWordColor: '#c1453a',
  cursorColor: '#dd7a5f',
};

const terrazzoTheme: Theme = {
  label: 'Terrazzo',
  background: '#f1e5da',
  textColor: '#023e3b',
  subTextColor: '#688e8f',
  wordColor: '#688e8f',
  correctWordColor: '#023e3b',
  incorrectWordColor: '#a01034',
  cursorColor: '#e0794e',
};

const modernDolchLightTheme: Theme = {
  label: 'Modern Dolch Light',
  background: '#dbdbdb',
  textColor: '#454545',
  subTextColor: '#a3a2a2',
  wordColor: '#a3a2a2',
  correctWordColor: '#454545',
  incorrectWordColor: '#c23554',
  cursorColor: '#2f8a78',
};

const vesperLightTheme: Theme = {
  label: 'Vesper Light',
  background: '#ffffff',
  textColor: '#000000',
  subTextColor: '#a0a0a0',
  wordColor: '#a0a0a0',
  correctWordColor: '#000000',
  incorrectWordColor: '#ed2839',
  cursorColor: '#067a6e',
};

const blueberryLightTheme: Theme = {
  label: 'Blueberry Light',
  background: '#dae0f5',
  textColor: '#3d5266',
  subTextColor: '#92a4be',
  wordColor: '#92a4be',
  correctWordColor: '#3d5266',
  incorrectWordColor: '#df4576',
  cursorColor: '#df4576',
};

const oliveTheme: Theme = {
  label: 'Olive',
  background: '#e9e5cc',
  textColor: '#373731',
  subTextColor: '#8c886f',
  wordColor: '#8c886f',
  correctWordColor: '#373731',
  incorrectWordColor: '#cf2f2f',
  cursorColor: '#92946f',
};

const dinoTheme: Theme = {
  label: 'Dino',
  background: '#ffffff',
  textColor: '#1d221f',
  subTextColor: '#8a8a8a',
  wordColor: '#8a8a8a',
  correctWordColor: '#1d221f',
  incorrectWordColor: '#ff5f5f',
  cursorColor: '#40d672',
};

export const themeOptions: { label: string; value: Theme }[] = [
  { label: "Cipher", value: cipherTheme },
  { label: "Cipher Paper", value: cipherPaperTheme },
  { label: "Dracula", value: draculaTheme },
  { label: "Nord", value: nordTheme },
  { label: "Gruvbox Dark", value: gruvboxDarkTheme },
  { label: "Monokai", value: monokaiTheme },
  { label: "One Dark", value: oneDarkTheme },
  { label: "Catppuccin", value: catppuccinTheme },
  { label: "Rose Pine", value: rosePineTheme },
  { label: "Rose Pine Moon", value: rosePineMoonTheme },
  { label: "Solarized Dark", value: solarizedDarkTheme },
  { label: "Iceberg Dark", value: icebergDarkTheme },
  { label: "Everblush", value: everblushTheme },
  { label: "Horizon", value: horizonTheme },
  { label: "Serika Dark", value: serikaDarkTheme },
  { label: "VS Code", value: vsCodeTheme },
  { label: "GitHub", value: gitHubTheme },
  { label: "Material", value: materialTheme },
  { label: "Discord", value: discordTheme },
  { label: "Sonokai", value: sonokaiTheme },
  { label: "Phantom", value: phantomTheme },
  { label: "Aurora", value: auroraTheme },
  { label: "Matrix", value: matrixTheme },
  { label: "Vesper", value: vesperTheme },
  { label: "Repose Dark", value: reposeDarkTheme },
  { label: "Modern Dolch", value: modernDolchTheme },
  { label: "Blueberry Dark", value: blueberryDarkTheme },
  { label: "Cherry Blossom", value: cherryBlossomTheme },
  { label: "Midnight", value: midnightTheme },
  { label: "Terra", value: terraTheme },
  { label: "Watermelon", value: watermelonTheme },
  { label: "Gruvbox Light", value: gruvboxLightTheme },
  { label: "Solarized Light", value: solarizedLightTheme },
  { label: "Iceberg Light", value: icebergLightTheme },
  { label: "Paper", value: paperTheme },
  { label: "Serika", value: serikaTheme },
  { label: "Nord Light", value: nordLightTheme },
  { label: "Rose Pine Dawn", value: rosePineDawnTheme },
  { label: "Repose Light", value: reposeLightTheme },
  { label: "Camping", value: campingTheme },
  { label: "Desert Oasis", value: desertOasisTheme },
  { label: "Mizu", value: mizuTheme },
  { label: "Botanical", value: botanicalTheme },
  { label: "Lavender", value: lavenderTheme },
  { label: "Peaches", value: peachesTheme },
  { label: "Terrazzo", value: terrazzoTheme },
  { label: "Modern Dolch Light", value: modernDolchLightTheme },
  { label: "Vesper Light", value: vesperLightTheme },
  { label: "Blueberry Light", value: blueberryLightTheme },
  { label: "Olive", value: oliveTheme },
  { label: "Dino", value: dinoTheme },
];

// The two CipherSprint originals head every theme list.
export const isOriginalTheme = (label: string): boolean => label.startsWith('Cipher');
export const DEFAULT_THEME: Theme = cipherTheme;
