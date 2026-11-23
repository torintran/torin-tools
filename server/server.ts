import { createStaticServer } from './static.ts';

const port = Number(process.env.PORT ?? 4173);
const gateway = process.env.POSTMAN_GATEWAY_ENABLED === '1'
  ? { origin: new URL(process.env.POSTMAN_GATEWAY_ORIGIN ?? 'http://localhost:' + port).origin }
  : undefined;
const server = createStaticServer(undefined, gateway);
server.listen(port, process.env.LISTEN_HOST ?? 'localhost', () => {
  const address = server.address();
  if (address && typeof address !== 'string') console.log('Torin Tools is listening on port ' + address.port);
});
