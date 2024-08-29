import { useContext, useState } from "react";
import * as Y from "yjs";
import { CHARACTERS, CONTACTS } from "./data";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Button } from "./components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./components/ui/command";
import { Textarea } from "./components/ui/textarea";
import { useShallowY, useY } from "./yjs-hooks/useY";

export const ContactList = ({ owner }: { owner: number }) => {
  // Only re-render when contacts are added/deleted
  // (each Contact observes changes to it separately)
  const contactsCtx = useContext(CONTACTS);
  const allContacts = useShallowY(contactsCtx);

  // Collect relevant contacts to a list
  const contacts: { id: string; contact: Y.Map<string>; selfFirst: boolean }[] = [];
  const contactMap: Map<number, typeof contacts[0]> = new Map();
  for (const id of Object.keys(allContacts)) {
    const idParts = parseId(id);
    if (idParts.includes(owner)) {
      const contact = {
        id: id,
        contact: contactsCtx.get(id)!,
        selfFirst: idParts[0] == owner,
      };
      contacts.push(contact);
      contactMap.set(idParts[0] == owner ? idParts[1] : idParts[0], contact);
    }
  }

  // TODO sort it somehow

  const allCharacters = useY(useContext(CHARACTERS));
  const availableContacts: {id: number, name: string}[] = [];
  for (const id of Object.keys(allCharacters)) {
    const intId = parseInt(id);
    if (intId != owner && !contactMap.has(intId)) {
      const character = allCharacters[id];
      availableContacts.push({
        id: intId,
        name: `${character.name} (${character.workName})`
      });
    }
  }
  
  const createContact = (otherId: number) => {
    const id = newContactId(owner, otherId);
    const contact = new Y.Map<string>();
    contactsCtx.set(id, contact);

    const selfPrefix = otherId < owner ? "a" : "b";
    const otherPrefix = otherId < owner ? "b" : "a";
    contact.set(`${selfPrefix}/id`, `${owner}`);
    contact.set(`${otherPrefix}/id`, `${otherId}`);
  }

  return (
    <div>
      <h2>Contacts</h2>
      <CreateContact characters={availableContacts} createContact={createContact} />
      {contacts.map((entry) => (
        <Contact {...entry} key={entry.id} />
      ))}
    </div>
  );
};

const Contact = ({
  contact,
  selfFirst,
}: {
  contact: Y.Map<string>;
  selfFirst: boolean;
}) => {
  const data = useY(contact);
  const selfPrefix = selfFirst ? "a" : "b";
  const otherPrefix = selfFirst ? "b" : "a";

  const characters = useContext(CHARACTERS);
  const otherId = data[`${otherPrefix}/id`];
  const other = useY(characters.get(otherId)!);

  return (
    <div>
      <h3>
        {other.name} ({other.workName})
      </h3>
      <Textarea defaultValue={data[`${selfPrefix}/desc`] ?? ""} />
      <Textarea defaultValue={data[`${otherPrefix}/desc`] ?? ""} />
    </div>
  );
};

const CreateContact = ({characters, createContact}: {characters: {id: number, name: string}[], createContact: (withId: number) => void}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          Uusi kontakti...
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Etsi hahmoja..." />
          <CommandList>
            <CommandEmpty>Kaikkiin hahmoihin jo kontaktit!</CommandEmpty>
            <CommandGroup>
              {characters.map((character) => (
                <CommandItem
                  key={character.id}
                  value={`${character.id}`}
                  onSelect={(currentValue) => {
                    setOpen(false);
                    createContact(parseInt(currentValue));
                  }}
                >
                  {character.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

function newContactId(charA: number, charB: number) {
  return charA > charB ? `${charA}-${charB}` : `${charB}-${charA}`;
}

function parseId(contactId: string): number[] {
  return contactId.split("-").map(i => parseInt(i));
}
