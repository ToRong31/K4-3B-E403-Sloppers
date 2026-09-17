import { useCallback, useEffect, useState } from 'react';

export function useAsyncResource(loader) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  const load = useCallback(() => {
    let active = true;
    setState((current) => ({ ...current, status: 'loading', error: null }));
    loader()
      .then((data) => {
        if (active) setState({ status: 'ready', data, error: null });
      })
      .catch((error) => {
        if (active) setState({ status: 'error', data: null, error });
      });
    return () => {
      active = false;
    };
  }, [loader]);

  useEffect(() => load(), [load]);

  return { ...state, reload: load };
}

