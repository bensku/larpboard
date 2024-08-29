import { createContext } from "react";
import * as Y from 'yjs';

export const CONTACTS = createContext<Y.Map<Y.Map<string>>>(null!);
export const CHARACTERS = createContext<Y.Map<Y.Map<string>>>(null!);