import * as Y from 'yjs';
import { CHARACTERS, CONTACTS } from './data'
import { ContactList } from './contacts';

export const App = () => {
  const doc = new Y.Doc();
  const characters = doc.getMap('characters');
  const char1 = new Y.Map();
  characters.set('1', char1);
  char1.set('id', '1');
  char1.set('name', 'Testi Testilä');
  char1.set('workName', 'Testityyppi');

  const char2 = new Y.Map();
  characters.set('2', char2);
  char2.set('id', '2');
  char2.set('name', 'Matti Meikäläinen');
  char2.set('workName', 'Jokapaikanhöylä');

  return <CONTACTS.Provider value={doc.getMap('contacts')}>
    <CHARACTERS.Provider value={doc.getMap('characters')}>
      <ContactList owner={1} />
    </CHARACTERS.Provider>
  </CONTACTS.Provider>;
}
