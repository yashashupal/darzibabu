import { createContext, useContext, useEffect } from 'react';
import { settingsDoc } from '../services/api';
import { subscribe } from '../services/storage';
import { useAsync } from '../hooks/useAsync';

const Ctx = createContext({ settings: null, reload: () => {} });
export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }) {
  const { data, reload } = useAsync(() => settingsDoc.get(), []);
  useEffect(() => subscribe((k) => (k === 'doc:settings' || k === '*') && reload(true)), [reload]);
  // Fall back to the synchronous snapshot so first paint never blocks on settings.
  const settings = data || settingsDoc.snapshot();
  return <Ctx.Provider value={{ settings, reload }}>{children}</Ctx.Provider>;
}
