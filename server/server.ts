import { createStaticServer } from './static.ts';

const port = Number(process.env.PORT ?? 4173);
const gateway = process.env.TORIN_GATEWAY === '1'
  ? { origin: new URL(process.env.TORIN_ORIGIN ?? 'http://localhost:' + port).origin }
  : undefined;
const server = createStaticServer(undefined, gateway);
server.listen(port, process.env.TORIN_LISTEN ?? 'localhost', () => {
  const address = server.address();
  if (address && typeof address !== 'string') console.log('Torin Tools is listening on port ' + address.port);
});
