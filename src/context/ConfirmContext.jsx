import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const ConfirmCtx = createContext(null);
/** const confirm = useConfirm(); if (await confirm({ title, message, confirmLabel, danger })) { ... } */
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setState({ title: 'Are you sure?', message: '', confirmLabel: 'Confirm', danger: false, ...opts });
      }),
    []
  );
  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal open={!!state} onClose={() => close(false)} title={state?.title} size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>Cancel</Button>
            <Button variant={state?.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>{state?.confirmLabel}</Button>
          </>
        }>
        <p className="text-sm text-slate-600">{state?.message}</p>
      </Modal>
    </ConfirmCtx.Provider>
  );
}
