import { useContext, useState } from "react";
import * as Y from "yjs";
import { CHARACTERS, CONTACTS } from "./data";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Button } from "./components/ui/button";
import { ChevronsUpDown, CircleXIcon } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./components/ui/command";
import { useShallowY, useY } from "./yjs-hooks/useY";
import { TextEditor } from "./editor";
import { Link } from "wouter";

export const ContactList = ({ owner }: { owner: number }) => {
  // Only re-render when contacts are added/deleted
  // (each Contact observes changes to it separately)
  const contactsCtx = useContext(CONTACTS);
  const allContacts = useShallowY(contactsCtx);

  const characters = useContext(CHARACTERS);
  const self = useShallowY(characters.get(`${owner}`)!);

  // Collect relevant contacts to a list
  const contacts: { id: string; contact: Y.Map<string | Y.XmlFragment>; selfFirst: boolean }[] = [];
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
    const contact = new Y.Map<string | Y.XmlFragment>();
    contactsCtx.set(id, contact);

    const selfPrefix = otherId < owner ? "a" : "b";
    const otherPrefix = otherId < owner ? "b" : "a";
    contact.set(`${selfPrefix}/id`, `${owner}`);
    contact.set(`${selfPrefix}/desc`, new Y.XmlFragment());
    contact.set(`${otherPrefix}/id`, `${otherId}`);
    contact.set(`${otherPrefix}/desc`, new Y.XmlFragment());
  }

  const destroyContact = (id: string) => {
    contactsCtx.delete(id);
  };

  const selfName = self.name ? self.name : self.workName;
  return (
    <div>
      <h2 className="text-2xl p-2">Kontaktit</h2>
      <CreateContact characters={availableContacts} createContact={createContact} />
      {contacts.map((entry) => (
        <Contact selfName={selfName} {...entry} key={entry.id} destroy={() => destroyContact(entry.id)} />
      ))}
    </div>
  );
};

const Contact = ({
  selfName,
  contact,
  selfFirst,
  destroy
}: {
  selfName: string;
  contact: Y.Map<string | Y.XmlFragment>;
  selfFirst: boolean;
  destroy: () => void;
}) => {
  const selfPrefix = selfFirst ? "a" : "b";
  const otherPrefix = selfFirst ? "b" : "a";

  const characters = useContext(CHARACTERS);
  const otherId = contact.get(`${otherPrefix}/id`) as string;
  const other = useY(characters.get(otherId)!);

  const confirmDestroy = () => {
    const ok = confirm(`Haluatko varmasti poistaa kontaktin ${selfName} - ${other.name} MOLEMMILTA hahmoilta?`);
    if (ok) {
      destroy();
    }
  };

  return (
    <div>
      <h3 className="text-xl">
        <Link href={`/characters/${otherId}`}>
          {other.name} (<span className="text-gray-600">{other.workName}</span>)
        </Link>
      </h3>
      <div className="flex flex-row">
        <div className="flex flex-col flex-grow">
          <h4>{selfName} -&gt; {other.name}</h4>
          <TextEditor fragment={contact.get(`${selfPrefix}/desc`) as Y.XmlFragment} />
        </div>
        <div className="flex flex-col flex-grow">
          <h4>{other.name} -&gt; {selfName}</h4>
          <TextEditor fragment={contact.get(`${otherPrefix}/desc`) as Y.XmlFragment} />
        </div>
        <Button variant="ghost" size="icon" onClick={confirmDestroy}>
          <CircleXIcon />
        </Button>
      </div>
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
            <CommandEmpty>Hahmoja ei löytynyt.</CommandEmpty>
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
