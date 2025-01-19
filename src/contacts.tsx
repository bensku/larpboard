import { useContext, useState } from "react";
import { PROJECT } from "./data"
import { Contact, createContact, sortContacts, useContacts } from "./data/contact"
import { Character, useCharacter, useCharacters } from "./data/character";
import { Textarea } from "./components/ui/textarea";
import { useYjsPlainText } from "./data/hooks";
import { Popover } from "@radix-ui/react-popover";
import { PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Button } from "./components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./components/ui/command";

export const ContactList = ({ chId }: { chId: string }) => {
  const doc = useContext(PROJECT);
  const contacts = sortContacts(chId, useContacts(doc, chId));
  const contactSet = new Set(contacts.map(contact => contact.aId == chId ? contact.bId : contact.aId));
  const availableContacts = useCharacters(doc)
    .filter((ch) => !contactSet.has(ch.id));

  const newContact = (toId: string) => {
    createContact(doc, chId, toId);
  }

  return <div>
    <h2>Kontaktit</h2>
    {contacts.map((contact) => <ContactView contextCh={chId} contact={contact} />)}
    <CreateContact characters={availableContacts} newContact={newContact} />
  </div>
}

export const ContactView = ({ contextCh, contact }: { contextCh: string; contact: Contact }) => {
  const selfFirst = contact.aId == contextCh;
  const doc = useContext(PROJECT);
  // const self = useCharacter(doc, selfFirst ? contact.aId : contact.bId, false);
  const other = useCharacter(doc, selfFirst ? contact.bId : contact.aId, false);

  // Subscribe to description texts separately
  const [selfDesc, setSelfDesc] = useYjsPlainText(selfFirst ? contact.aDesc : contact.bDesc);
  const [otherDesc, setOtherDesc] = useYjsPlainText(selfFirst ? contact.bDesc : contact.aDesc);

  return <div>
    <h3>{other.name} ({other.workName})</h3>
    <div className="flex">
      <Textarea onChange={(event) => setSelfDesc(event.target.value)}>{selfDesc}</Textarea>
      <Textarea onChange={(event) => setOtherDesc(event.target.value)}>{otherDesc}</Textarea>
    </div>
  </div>;
};

const CreateContact = ({characters, newContact}: {characters: Character[], newContact: (toId: string) => void}) => {
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
                    newContact(currentValue);
                  }}
                >
                  {character.name} ({character.workName})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
