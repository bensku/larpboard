import * as Y from "yjs";
import { getContacts } from "@/data/contact";
import { ValidationResult } from "./core";
import { Settings } from "@/data/settings";
import { Character, getCharacter } from "@/data/character";
import { getTags } from "@/data/tag";

export function validateContactCount(doc: Y.Doc, settings: Settings, character: Character): ValidationResult {
  if (character.ignoreContactCounts) {
    return { pass: true, messages: [] };
  }
  const contacts = getContacts(doc, character.id);

  const messages: string[] = [];
  if (contacts.length < settings.minContacts) {
    messages.push(`Liian vähän kontakteja, suositus vähintään ${settings.minContacts}`);
  } else if (contacts.length > settings.maxContacts) {
    messages.push(`Liikaa kontakteja, suositus enintään ${settings.maxContacts}`);
  }

  const closeContacts = contacts.filter(contact => contact.close);
  if (closeContacts.length < settings.minCloseContacts) {
    messages.push(`Liian vähän lähikontakteja, suositus vähintään ${settings.minCloseContacts}`);
  } else if (closeContacts.length > settings.maxCloseContacts) {
    messages.push(`Liikaa lähikontakteja, suositus enintään ${settings.maxCloseContacts})`);
  }

  return { pass: messages.length == 0, messages };
}

export function validateGroupContacts(doc: Y.Doc, _settings: Settings, character: Character): ValidationResult {
  if (character.ignoreMissingGroupContacts) {
    return { pass: true, messages: [] };
  }

  const groups = getTags(doc, character.id)[0].filter(tag => tag.type == 'group');
  const contacts = getContacts(doc, character.id);
  const contactSet = new Set();
  for (const contact of contacts) {
    contactSet.add(contact.aId);
    contactSet.add(contact.bId);
  }

  // Iterate through all groups and check that we have contacts to all of their members
  const messages: string[] = [];
  for (const group of groups) {
    for (const member of group.characters.keys()) {
      if (member != character.id && !contactSet.has(member)) {
        const other = getCharacter(doc, member);
        messages.push(`Ei kontaktia ryhmän ${group.id} jäsenen ${other.name || other.workName} kanssa`);
      }
    }
  }

  return { pass: messages.length == 0, messages };
}

export function validateOneSidedContacts(doc: Y.Doc, _settings: Settings, character: Character): ValidationResult {
  const contacts = getContacts(doc, character.id);
  
  const messages: string[] = [];
  for (const contact of contacts) {
    if (contact.oneSided) {
      continue; // This was intentional
    }
    const selfDesc = contact.aId == character.id ? contact.aDesc : contact.bDesc;
    if (selfDesc.toString().trim().length < 5) {
      const otherChar = getCharacter(doc, contact.aId == character.id ? contact.bId : contact.aId);
      messages.push(`Yksipuolinen kontakti hahmon ${otherChar.name || otherChar.workName} kanssa`);
    }
  }
  

  return { pass: messages.length == 0, messages: messages };
}