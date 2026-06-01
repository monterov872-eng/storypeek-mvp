import 'dotenv/config';
import { loadConfig } from '../src/config.js';
import { fetchApiProfile } from '../src/services/apiProfile.js';

const username = process.argv[2] ?? 'instagram';
const result = await fetchApiProfile(username, loadConfig());
console.log(
  JSON.stringify(
    {
      username: result.username,
      fullName: result.fullName,
      followersCount: result.followersCount,
      followingCount: result.followingCount,
      postsCount: result.postsCount,
      postsReturned: result.posts.length,
      hasAvatar: Boolean(result.profilePictureUrl),
    },
    null,
    2,
  ),
);
