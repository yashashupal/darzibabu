import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { storage } from '../services/storage';
import { useToast } from './ToastContext';

const Ctx = createContext(null);
export const useWishlist = () => useContext(Ctx);

export function WishlistProvider({ children }) {
  const toast = useToast();
  const [ids, setIds] = useState(() => storage.get('wishlist', []));
  useEffect(() => {
    storage.set('wishlist', ids);
  }, [ids]);
  const toggle = useCallback(
    (id, name) => {
      const has = ids.includes(id);
      setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
      toast.success(has ? `Removed ${name || 'item'} from your wishlist.` : `Saved ${name || 'item'} to your wishlist.`);
    },
    [ids, toast]
  );
  return <Ctx.Provider value={{ ids, toggle, has: (id) => ids.includes(id) }}>{children}</Ctx.Provider>;
}
