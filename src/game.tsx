import * as Y from 'yjs';
import { PROJECT } from './data'
import { Link, Route, Switch } from 'wouter';
import { CharacterList, CharacterView } from './character';
import { useSettings } from './data/settings';
import { useContext, useEffect, useState } from 'react';
import { Button } from './components/ui/button';
import { SettingsView } from './settings';
import { TooltipProvider } from './components/ui/tooltip';
import { HocuspocusProvider } from "@hocuspocus/provider";

export const Game = () => {


  return <div className="max-w-5xl ml-auto mr-auto">
    <Switch>
      <Route path="/:project/:authToken" nest>
        {({ project, authToken }) => <ProjectView project={project} authToken={authToken} />}
      </Route>
      <Route>
        Eksyksissä? Pyydä ylläpitäjältä linkki projektiisi!
      </Route>
    </Switch>
  </div>
}

const ProjectView = ({ project, authToken }: { project: string, authToken: string }) => {
  const [doc, setDoc] = useState<Y.Doc | undefined>(undefined);

  useEffect(() => {
    const provider = new HocuspocusProvider({
      url: '/sync',
      name: project,
      token: authToken
    });
    setDoc(provider.document);
  }, [project, authToken]);

  if (!doc) {
    return <div>Loading...</div>
  };

  return <PROJECT.Provider value={doc}>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </PROJECT.Provider>;
}

const App = () => {
  const doc = useContext(PROJECT);
  const settings = useSettings(doc);

  return <div>
    <div className="flex p-2 m-1 border-b-2">
      <Link to={`/`}>
        <h1 className='text-4xl mr-5'>{settings?.name}</h1>
      </Link>

      <Link to={`/`}>
        <Button variant="outline">Hahmot</Button>
      </Link>
      <Link to={'/settings'}>
        <Button variant="outline">Asetukset</Button>
      </Link>
    </div>
    <Switch>
      <Route path="/characters/:id">
        {({id}) => <CharacterView id={id} />}
      </Route>
      <Route path="/settings">
        <SettingsView />
      </Route>
      <Route>
        <CharacterList />
      </Route>
    </Switch>
  </div>
}