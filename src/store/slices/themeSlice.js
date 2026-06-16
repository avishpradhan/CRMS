import { createSlice } from '@reduxjs/toolkit';

const getInitialDarkMode = () => {
  const storedTheme = localStorage.getItem('crms_theme');
  if (storedTheme) {
    return storedTheme === 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    darkMode: getInitialDarkMode(),
    sidebarCollapsed: false,
  },
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('crms_theme', state.darkMode ? 'dark' : 'light');
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const { toggleDarkMode, toggleSidebar, setSidebarCollapsed } = themeSlice.actions;
export default themeSlice.reducer;

