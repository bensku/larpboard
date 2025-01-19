import { useRef, useSyncExternalStore } from "react";
import * as Y from "yjs";
import { TypeOf, z } from "zod";
import { getYObject, queryYjs } from "./reads";

export function useYjsData<T extends z.ZodObject<any>>(map: Y.Map<unknown>, type: T, key: string, deep: boolean): TypeOf<T> {
  const prevDataRef = useRef<any | null>(null);

  const value = map.get(key);
  if (!(value instanceof Y.Map)) {
    throw new Error(`Expected Y.Map at key ${key}, got ${value}`);
  }
  const observe = deep ? value.observeDeep.bind(map) : value.observe.bind(map);
  const unobserve = deep ? value.unobserveDeep.bind(map) : value.unobserve.bind(map);

  return useSyncExternalStore((onChange) => {
    const handler = () => {
      prevDataRef.current = null;
      onChange();
    };
    observe(handler);
    return () => unobserve(handler);
  }, () => {
    if (prevDataRef.current === null) {
      prevDataRef.current = getYObject(value, key, type);
    }
    return prevDataRef.current;
  });
}

export function useYjsQuery<T extends z.ZodObject<any>>(map: Y.Map<unknown>, type: T, queries: object[], deep: boolean): TypeOf<T>[] {
  const prevDataRef = useRef<any | null>(null);

  const observe = deep ? map.observeDeep.bind(map) : map.observe.bind(map);
  const unobserve = deep ? map.unobserveDeep.bind(map) : map.unobserve.bind(map);

  return useSyncExternalStore((onChange) => {
    const handler = () => {
      prevDataRef.current = null;
      onChange();
    };
    observe(handler);
    return () => unobserve(handler);
  },  () => {
    if (prevDataRef.current === null) {
      prevDataRef.current = queryYjs(map, type, queries);
    }
    return prevDataRef.current;
  });
}

export function useYjsPlainText(text: Y.Text): [string, (str: string) => void] {
  const str = useSyncExternalStore((onChange) => {
    const handler = () => onChange();
    text.observe(handler);
    return () => text.unobserve(handler);
  }, () => {
    return text.toString();
  });

  const setStr = (str: string) => {
    // TODO something more collaborative
    text.delete(0, text.length);
    text.insert(0, str);
  }

  return [str, setStr];
}

export function useYjsValue<T extends object, K extends keyof T>(obj: T, key: K): [T[K], (value: T[K]) => void] {
  const value = useSyncExternalStore((onChange) => {
    const map = (obj as any)._y as Y.Map<unknown>;
    const handler = (event: Y.YMapEvent<unknown>) => {
      if (key in event.keysChanged) {
        onChange();
      }
    };
    map.observe(handler);
    return () => map.unobserve(handler);
  }, () => obj[key]);

  const setValue = (value: T[K]) => {
    const map = (obj as any)._y as Y.Map<unknown>;
    map.set(key as string, value);
  };

  return [value, setValue];
}