import * as Y from "yjs";
import { TypeOf, z } from "zod";

export function getYObject(map: Y.Map<unknown>, key: string, type: z.ZodObject<any>): TypeOf<typeof type> {
  const value = map.get(key);
  if (!(value instanceof Y.Map)) {
    throw new Error(`Expected Y.Map at key ${key}, got ${value}`);
  }
  return parseMapData(value, type);
}

export function queryYjs<T extends z.ZodObject<any>>(map: Y.Map<unknown>, type: T, queries: object[]): TypeOf<T>[] {
  const matches: TypeOf<T>[] = [];
  for (const [key, value] of map.entries()) {
    if (!(value instanceof Y.Map)) {
      console.warn(`Expected Y.Map at key ${key}, got ${value}`);
      continue;
    }
    
    // Check queries until one matches (if one matches)
    let queryMatch = false;
    outer: for (const query of queries) {
      for (const [queryKey, queryValue] of Object.entries(query)) {
        if (value.get(queryKey) !== queryValue) {
          continue outer; // This query failed, try next one
        }
      }
      queryMatch = true;
      break;
    }

    if (queryMatch) {
      matches.push(parseMapData(value, type));
    }
  }
  return matches;
}

export function parseMapData<T extends z.ZodObject<any>>(obj: Y.Map<unknown>, type: T): TypeOf<T> {
  // Unlike toJSON(), we only unwrap one layer of Yjs
  // This allows e.g. XMLFragment to be used for rich text
  const data = {} as Record<string, unknown>;
  for (const [key, value] of obj.entries()) {
    data[key] = value;
  }
  const parsed = type.parse(data);
  parsed._y = obj;
  return parsed;
}