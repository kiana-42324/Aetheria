export type ThemePreference='system'|'light'|'dark';
export const THEME_KEY='aetheria-theme';
export function readTheme():ThemePreference {try{const value=localStorage.getItem(THEME_KEY);if(value==='light'||value==='dark')return value}catch{}return 'system'}
export function applyTheme(preference:ThemePreference,darkSystem:boolean){document.documentElement.dataset.theme=preference==='system'?(darkSystem?'dark':'light'):preference}
