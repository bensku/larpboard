import { useRef, useState, useSyncExternalStore } from 'react';
import * as Y from 'yjs';
import { TypeOf, z } from 'zod';
import { parseMapData, queryYjs } from './reads';

export function useYjsData<T extends z.ZodObject<any>>(
  map: Y.Map<unknown>,
  type: T,
  key: string,
  deep: boolean,
): TypeOf<T> {
  const prevDataRef = useRef<any | null>(null);
  const [value, setValue] = useState<Y.Map<unknown> | undefined>(
    map.get(key) as Y.Map<unknown> | undefined,
  );

  return useSyncExternalStore(
    (onChange) => {
      const valueHandler = () => {
        prevDataRef.current = null;
        onChange();
      };

      const mapHandler = (event: Y.YMapEvent<unknown>) => {
        if (event.keysChanged.has(key)) {
          const value = map.get(key) as Y.Map<unknown> | undefined;
          setValue(value);
          if (value) {
            if (deep) {
              value.observeDeep(valueHandler);
            } else {
              value.observe(valueHandler);
            }
          }
          prevDataRef.current = null;
          onChange();
        }
      };
      map.observe(mapHandler);

      // Value might already exist; if it does, mapHandler may never be called
      if (value) {
        if (deep) {
          value.observeDeep(valueHandler);
        } else {
          value.observe(valueHandler);
        }
      }

      return () => {
        map.unobserve(mapHandler);
        if (value) {
          if (deep) {
            value.unobserveDeep(valueHandler);
          } else {
            value.unobserve(valueHandler);
          }
        }
      };
    },
    () => {
      if (!(value instanceof Y.Map)) {
        // Key does not exist in map given to us (but it might soon)
        return undefined;
      } else if (prevDataRef.current === null) {
        // Key does exist, and we'll need to update JS object based on it
        prevDataRef.current = parseMapData(value, type);
      }
      // Return cached JS object to avoid infinite React rerender loops
      return prevDataRef.current;
    },
  );
}

export function useYjsQuery<T extends z.ZodObject<any>>(
  map: Y.Map<unknown>,
  type: T,
  queries: object[],
  deep: boolean,
  filter?: (path: string[]) => boolean,
): TypeOf<T>[] {
  const prevDataRef = useRef<any | null>(null);

  const observe = deep ? map.observeDeep.bind(map) : map.observe.bind(map);
  const unobserve = deep
    ? map.unobserveDeep.bind(map)
    : map.unobserve.bind(map);

  return useSyncExternalStore(
    (onChange) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = (event: Y.YEvent<any>[] | Y.YMapEvent<unknown>) => {
        let changed = false;
        if (Array.isArray(event) && filter) {
          // If we have a filter function, only note change events that pass it
          for (const e of event) {
            if (filter(e.path as string[])) {
              changed = true;
              break;
            }
          }
        } else {
          changed = true;
        }
        if (changed) {
          prevDataRef.current = null;
          onChange();
        }
      };
      observe(handler);
      return () => {
        unobserve(handler);
      };
    },
    () => {
      if (prevDataRef.current === null) {
        prevDataRef.current = queryYjs(map, type, queries);
      }
      return prevDataRef.current;
    },
  );
}

export function useYjsPlainText(text: Y.Text): [string, (str: string) => void] {
  const str = useSyncExternalStore(
    (onChange) => {
      const handler = () => onChange();
      text.observe(handler);
      return () => text.unobserve(handler);
    },
    () => {
      return text.toString();
    },
  );

  const setStr = (str: string) => {
    // TODO something more collaborative
    text.delete(0, text.length);
    text.insert(0, str);
  };

  return [str, setStr];
}

export function useYjsValue<T extends object, K extends keyof T>(
  obj: T,
  key: K,
): [T[K], (value: T[K]) => void] {
  const value = useSyncExternalStore(
    (onChange) => {
      const map = (obj as any)._y as Y.Map<unknown>;
      if (!map) {
        return () => null;
      }
      const handler = (event: Y.YMapEvent<unknown>) => {
        if (event.keysChanged.has(key)) {
          onChange();
        }
      };
      map.observe(handler);
      return () => map.unobserve(handler);
    },
    () => {
      // If we just peek at obj[key], this won't work for non-deep observing
      const map = (obj as any)._y as Y.Map<unknown>;
      if (!map) {
        // But on first render, the map won't be available...
        return obj[key];
      }
      return map.get(key as string) as T[K];
    },
  );

  const setValue = (value: T[K]) => {
    const map = (obj as any)._y as Y.Map<unknown>;
    map.set(key as string, value);
  };

  return [value, setValue];
}
