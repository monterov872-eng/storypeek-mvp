import 'dotenv/config';
import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = createApp(config);

app.listen(config.PORT, () => {
  console.log(`StoryPeek API listening on http://localhost:${config.PORT}`);
  console.log(`Instagram provider: ${config.INSTAGRAM_PROVIDER}`);
});
