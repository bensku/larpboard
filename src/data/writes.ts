import * as Y from "yjs";
import { TypeOf, z } from "zod";

export function updateData<T extends z.ZodObject<any>>(map: Y.Map<unknown>, key: string, data: Partial<TypeOf<T>>, type: T): void {
  const validated = type.parse(data);

  // Add map and update its content in one transaction
  // Otherwise, shallow useYjsQuery would not see the full change
  map.doc!.transact(() => {
    let target = map.get(key);
    if (!target) {
      target = new Y.Map();
      map.set(key, target);
    }
    if (!(target instanceof Y.Map)) {
      throw new Error(`Expected Y.Map at key ${key}, got ${target}`);
    }

    for (const [k, v] of Object.entries(validated)) {
      if (v instanceof Y.Map) {
        // Update map content, do not replace it!
        const oldMap = target.get(k);
        if (oldMap instanceof Y.Map) {
          for (const [kk, vv] of v.entries()) {
            oldMap.set(kk, vv);
          }
        } else {
          target.set(k, v);
        }
      } else {
        target.set(k, v);
      }
      // TODO special cases for rest of shared types
    }
  });
}

export function deleteData(map: Y.Map<unknown>, key: string): void {
  map.delete(key);
}