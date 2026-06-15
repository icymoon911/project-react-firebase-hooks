import { useEffect, useRef } from 'react';
import { RefHook } from './refHooks';

export default (): RefHook<boolean> => {
  const isMounted = useRef<boolean>(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  return isMounted;
};
