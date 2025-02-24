import { useContext, useState } from "react";
import { PROJECT } from "./data"
import { Contact, createContact, deleteContact, posSource, sortContacts, updateContact, useContacts } from "./data/contact"
import { Character, useCharacter, useCharacters } from "./data/character";
import { Popover } from "@radix-ui/react-popover";
import { PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Button } from "./components/ui/button";
import { ChevronsUpDown, CircleXIcon, GripVerticalIcon } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./components/ui/command";
import { CharacterCard, CharacterName } from "./character";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "./components/ui/alert-dialog";
import { Toggle } from "./components/form";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import { TextEditor } from "./editor";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./components/ui/hover-card";

export const ContactList = ({ chId }: { chId: string }) => {
  const doc = useContext(PROJECT);
  const contacts = sortContacts(chId, useContacts(doc, chId));
  const contactSet = new Set(contacts.map(contact => contact.aId == chId ? contact.bId : contact.aId));
  const availableContacts = useCharacters(doc)
    .filter((ch) => !contactSet.has(ch.id))
    .filter((ch) => ch.id != chId);

  const newContact = (toId: string) => {
    createContact(doc, chId, toId);
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = contacts.findIndex(c => `${c.aId}-${c.bId}` === active.id);
    const newIndex = contacts.findIndex(c => `${c.aId}-${c.bId}` === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Swap contacts in list before we start calculating position CRDTs
    // This avoids some VERY cursed math in position calculations
    const contact = contacts[oldIndex];
    contacts.splice(oldIndex, 1);
    contacts.splice(newIndex, 0, contact);
    
    // Whether we're A or B varies between contacts, so we still get to do something mildly cursed
    const newPos = posSource.createBetween(
      contacts[newIndex - 1]?.[contacts[newIndex - 1].aId == chId ? 'aSortKey' : 'bSortKey'],
      contacts[newIndex + 1]?.[contacts[newIndex + 1].aId == chId ? 'aSortKey' : 'bSortKey']
    );

    updateContact(doc, `${contact.aId}-${contact.bId}`, {
      [contact.aId == chId ? 'aSortKey' : 'bSortKey']: newPos
    });
  };

  return <div>
    <div className="flex items-center gap-4">
      <h2 className="text-2xl">Kontaktit</h2>
      <div>{contacts.length} kontaktia</div>
    </div>
    <DndContext 
      modifiers={[restrictToVerticalAxis]} 
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <SortableContext items={contacts.map((contact) => `${contact.aId}-${contact.bId}`)} strategy={verticalListSortingStrategy}>
        {contacts.map((contact) => <ContactView contextCh={chId} contact={contact} key={`${contact.aId}-${contact.bId}`} />)}
      </SortableContext>
    </DndContext>
    <CreateContact characters={availableContacts} newContact={newContact} />
  </div>
}

export const ContactView = ({ contextCh, contact }: { contextCh: string; contact: Contact }) => {
  const selfFirst = contact.aId == contextCh;
  const doc = useContext(PROJECT);
  // const self = useCharacter(doc, selfFirst ? contact.aId : contact.bId, false);
  const other = useCharacter(doc, selfFirst ? contact.bId : contact.aId, false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `${contact.aId}-${contact.bId}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    touchAction: 'none',
  };

  if (!other) {
    return null;
  }

  return <div ref={setNodeRef} style={style}>
    <div className="flex m-2 ml-0 gap-2">
      <div {...attributes} {...listeners}>
        <GripVerticalIcon />
      </div>
      <h3 className="flex-grow">
        <HoverCard>
          <HoverCardTrigger>
            <CharacterName character={other} />
          </HoverCardTrigger>
          <HoverCardContent>
            <CharacterCard character={other} />
          </HoverCardContent>
        </HoverCard>
      </h3>
      <Toggle obj={contact} field="close" label="Lähikohtakti" />
      <Toggle obj={contact} field="oneSided" label="Yksipuolinen" />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <CircleXIcon />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Poista kontakti?</AlertDialogTitle>
          <AlertDialogDescription>
            Haluatko varmasti poistaa kontaktin hahmoon <b><CharacterName character={other} /></b>?
            Kontakti poistuu <i>molemmilta</i> hahmoilta!
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Peru</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteContact(doc, contact)}>Poista kontakti</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    <div className="flex flex-col md:flex-row">
      <TextEditor fragment={selfFirst ? contact.aDesc : contact.bDesc} editable={true} />
      <TextEditor fragment={selfFirst ? contact.bDesc : contact.aDesc} editable={true} />
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
                  <CharacterName character={character} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
