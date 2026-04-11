import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'dark',
        sidebarCollapsed: false,
        setTheme: (theme) => set({ theme }),
        toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      }),
      { name: 'app-store', partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }) }
    )
  )
);
