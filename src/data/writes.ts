import * as Y from "yjs";
import { TypeOf, z } from "zod";

export function updateData<T extends z.ZodObject<any>>(map: Y.Map<unknown>, key: string, data: Partial<TypeOf<T>>, type: T): void {
  const validated = type.parse(data);
  let target = map.get(key);
  if (!target) {
    target = new Y.Map();
    map.set(key, target);
  }
  if (!(target instanceof Y.Map)) {
    throw new Error(`Expected Y.Map at key ${key}, got ${target}`);
  }

  for (const [k, v] of Object.entries(validated)) {
    target.set(k, v);
  }
}