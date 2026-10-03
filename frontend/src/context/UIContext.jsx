import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const UIContext = createContext(null);

const STORAGE_KEY = 'etrans_sidebar_collapsed';

function getInitialCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function UIProvider({ children }) {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    // Sur mobile (<768px) on ouvre/ferme le panneau ; sur desktop on replie/déplie.
    if (window.innerWidth < 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => {
        const next = !c;
        try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
        return next;
      });
    }
  }, []);

  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);

  // Ferme le panneau mobile automatiquement si on repasse en desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <UIContext.Provider value={{ collapsed, mobileOpen, toggleSidebar, closeMobileMenu }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI doit être utilisé dans un UIProvider');
  return ctx;
}
