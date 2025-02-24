import { useContext } from 'react';
import { resetSettings, useSettings } from './data/settings';
import { PROJECT } from './data';
import { FieldGroup, NumberField, TextField } from './components/form';
import { Button } from './components/ui/button';

export const SettingsView = () => {
  const doc = useContext(PROJECT);
  const settings = useSettings(doc);

  if (!settings) {
    return <Button onClick={() => resetSettings(doc)}>Alusta asetukset</Button>;
  }

  return (
    <div>
      <FieldGroup>
        <TextField obj={settings} field="name" label="Pelin nimi" grow />
      </FieldGroup>
      <FieldGroup>
        <NumberField
          obj={settings}
          field="minContacts"
          label="Kontaktien minimimäärä"
        />
        <NumberField
          obj={settings}
          field="maxContacts"
          label="Kontaktien maksimimäärä"
        />
      </FieldGroup>
      <FieldGroup>
        <NumberField
          obj={settings}
          field="minCloseContacts"
          label="Lähikontaktien minimimäärä"
        />
        <NumberField
          obj={settings}
          field="maxCloseContacts"
          label="Lähikontaktien maksimimäärä"
        />
      </FieldGroup>
    </div>
  );
};
