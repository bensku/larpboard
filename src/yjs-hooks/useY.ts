import { equalityDeep } from "lib0/function";
import { useRef, useSyncExternalStore } from "react";
import * as Y from "yjs";

export type YJsonPrimitive = string | number | boolean | null | Uint8Array;

export type YJsonValue =
  | YJsonPrimitive
  | YJsonValue[]
  | {
      [key: string]: YJsonValue;
    };

type YTypeToJson<YType> =
  YType extends Y.Array<infer Value>
    ? Array<YTypeToJson<Value>>
    : YType extends Y.Map<infer MapValue>
      ? { [key: string]: YTypeToJson<MapValue> }
      : YType extends Y.XmlFragment | Y.XmlText
        ? string
        : YType;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useY<YType extends Y.AbstractType<any>>(
  yData: YType
): YTypeToJson<YType> {
  const prevDataRef = useRef<YJsonValue | null>(null);
  return useSyncExternalStore(
    (callback) => {
      yData.observeDeep(callback);
      return () => yData.unobserveDeep(callback);
    },
    // Note: React requires reference equality
    () => {
      const data = yData.toJSON();
      if (equalityDeep(prevDataRef.current, data)) {
        return prevDataRef.current;
      } else {
        prevDataRef.current = data;
        return prevDataRef.current;
      }
    },
    () => yData.toJSON()
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useShallowY<YType extends Y.AbstractType<any>>(
    yData: YType
  ): YTypeToJson<YType> {
    const prevDataRef = useRef<YJsonValue | null>(null);
    return useSyncExternalStore(
      (callback) => {
        yData.observe(callback);
        return () => yData.unobserve(callback);
      },
      // Note: React requires reference equality
      () => {
        const data = yData.toJSON();
        if (equalityDeep(prevDataRef.current, data)) {
          return prevDataRef.current;
        } else {
          prevDataRef.current = data;
          return prevDataRef.current;
        }
      },
      () => yData.toJSON()
    );
  }