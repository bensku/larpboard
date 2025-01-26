import { Character } from "@/data/character";
import { getSettings, Settings } from "@/data/settings";
import * as Y from "yjs";

export interface ValidationResult {
  pass: boolean;
  messages: string[];
}

export type Validator = (doc: Y.Doc, settings: Settings, character: Character) => ValidationResult;

export function validate(doc: Y.Doc, character: Character, validators: Validator[]): ValidationResult {
  const settings = getSettings(doc);
  if (!settings) {
    return { pass: false, messages: ['Pelin asetusten lataaminen epäonnistui!'] };
  }
  let pass = true;
  let messages: string[] = [];
  for (const validator of validators) {
    const result = validator(doc, settings, character);
    messages = messages.concat(result.messages);
    if (!result.pass) {
      pass = false;
    }
  }
  return { pass, messages };
}