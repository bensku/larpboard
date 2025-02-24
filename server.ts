import { Hocuspocus } from '@hocuspocus/server';
import { SQLite } from '@hocuspocus/extension-sqlite';

const server = new Hocuspocus({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8080,
  async onAuthenticate(data) {
    const correctToken = process.env[`LARPBOARD_TOKEN_${data.documentName}`];
    if (correctToken != data.token) {
      throw new Error('incorrect token');
    }
  },
  extensions: [
    new SQLite({
      database: 'larpboard.sqlite',
    }),
  ],
});

server.listen();
