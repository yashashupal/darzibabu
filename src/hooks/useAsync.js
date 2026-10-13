import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribe } from '../services/storage';
import { REPOS } from '../services/api';

/** Runs an async function and tracks loading / error state. Re-runs when deps change or reload() is called. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const tick = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback((silent = false) => {
    const id = ++tick.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(() => fnRef.current())
      .then((data) => id === tick.current && setState({ data, loading: false, error: null }))
      .catch((error) => id === tick.current && setState((s) => ({ data: s.data, loading: false, error })));
  }, []);

  useEffect(() => {
    run();
    return () => {
      tick.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: run };
}

/** Loads a whole collection and refreshes it silently whenever that collection changes in storage. */
export function useCollection(name) {
  const repo = REPOS[name];
  const q = useAsync(() => repo.list(), [name]);
  const reload = q.reload;
  useEffect(
    () =>
      subscribe((key) => {
        if (key === name || key === '*') reload(true);
      }),
    [name, reload]
  );
  return { items: q.data || [], loading: q.loading && !q.data, error: q.error, reload };
}
