import { createContext } from "react";
import * as Y from 'yjs';

export const PROJECT = createContext<Y.Doc>(null!);
export const CONTACTS = createContext<Y.Map<Y.Map<string | Y.XmlFragment>>>(null!);
export const CHARACTERS = createContext<Y.Map<Y.Map<string>>>(null!);
export const GROUPS = createContext<Y.Map<Y.Map<boolean>>>(null!);