import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { adminLogin, adminLogout, adminUsersRepo, customerLogin, customerLogout, customerRegister, customersRepo, getAdminSession, getCustomerSession, rolesRepo } from '../services/api';
import { subscribe } from '../services/storage';

/* ---------------------------- customer (storefront) ---------------------------- */
const CustomerCtx = createContext(null);
export const useCustomer = () => useContext(CustomerCtx);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = getCustomerSession();
    if (!s) {
      setCustomer(null);
      setLoading(false);
      return;
    }
    const c = await customersRepo.get(s.id).catch(() => null);
    setCustomer(c);
    setLoading(false);
  }, []);
  useEffect(() => {
    refresh();
    return subscribe((k) => (k === 'session:customer' || k === 'customers' || k === '*') && refresh());
  }, [refresh]);

  const value = {
    customer, loading, refresh,
    login: async (e, p) => setCustomer(await customerLogin(e, p)),
    register: async (d) => setCustomer(await customerRegister(d)),
    logout: () => {
      customerLogout();
      setCustomer(null);
    },
  };
  return <CustomerCtx.Provider value={value}>{children}</CustomerCtx.Provider>;
}

/* --------------------------------- admin --------------------------------- */
const AdminCtx = createContext(null);
export const useAdmin = () => useContext(AdminCtx);

export function AdminAuthProvider({ children }) {
  const [state, setState] = useState({ user: null, role: null, loading: true });

  const refresh = useCallback(async () => {
    const s = getAdminSession();
    if (!s) return setState({ user: null, role: null, loading: false });
    const [users, roles] = await Promise.all([adminUsersRepo.list(), rolesRepo.list()]);
    const user = users.find((u) => u.id === s.id && u.status === 'active');
    if (!user) {
      adminLogout();
      return setState({ user: null, role: null, loading: false });
    }
    setState({ user, role: roles.find((r) => r.id === user.roleId) || null, loading: false });
  }, []);

  useEffect(() => {
    refresh();
    return subscribe((k) => ['session:admin', 'roles', 'adminUsers', '*'].includes(k) && refresh());
  }, [refresh]);

  const can = useCallback((perm) => !perm || !!state.role?.permissions?.includes(perm), [state.role]);
  const value = {
    ...state, can, refresh,
    login: async (e, p) => {
      await adminLogin(e, p);
      await refresh();
    },
    logout: () => {
      adminLogout();
      setState({ user: null, role: null, loading: false });
    },
  };
  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}
