import app from '../src/app.js';
const server = app.listen(0, '127.0.0.1', () => process.send(server.address().port));
