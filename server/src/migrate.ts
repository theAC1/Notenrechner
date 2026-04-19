import { migrate } from './db.js';

await migrate();
console.log('Migration complete.');
