/**
 * seed.js — Populate DevLink with demo data
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const Follow = require('./models/Follow');
const Like = require('./models/Like');
const Comment = require('./models/Comment');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devlink';

const users = [
  {
    username: 'alex_dev',
    email: 'alex@devlink.io',
    password: 'password123',
    displayName: 'Alex Chen',
    bio: 'Full-stack engineer @ Vercel. Building things on the web. Open source enthusiast.',
    location: 'San Francisco, CA',
    website: 'https://alexchen.dev',
    skills: ['TypeScript', 'React', 'Node.js', 'Rust', 'PostgreSQL'],
    githubUrl: 'https://github.com/alexchen',
    twitterUrl: 'https://twitter.com/alexchen'
  },
  {
    username: 'sara_codes',
    email: 'sara@devlink.io',
    password: 'password123',
    displayName: 'Sara Mitchell',
    bio: 'Backend engineer. Distributed systems nerd. Coffee-driven development.',
    location: 'Austin, TX',
    skills: ['Go', 'Kubernetes', 'gRPC', 'PostgreSQL', 'Redis'],
    githubUrl: 'https://github.com/saramitchell'
  },
  {
    username: 'devops_mike',
    email: 'mike@devlink.io',
    password: 'password123',
    displayName: 'Mike Torres',
    bio: 'DevOps @ Stripe. Making deployment boring (in a good way). K8s 🐳',
    location: 'New York, NY',
    skills: ['Terraform', 'Docker', 'AWS', 'Python', 'Bash']
  },
  {
    username: 'ux_priya',
    email: 'priya@devlink.io',
    password: 'password123',
    displayName: 'Priya Sharma',
    bio: 'Design engineer. Where design meets code. Figma → React.',
    location: 'London, UK',
    skills: ['React', 'Figma', 'CSS', 'TypeScript', 'Framer Motion'],
    twitterUrl: 'https://twitter.com/uxpriya'
  },
  {
    username: 'rust_dev',
    email: 'rust@devlink.io',
    password: 'password123',
    displayName: 'Jordan Wu',
    bio: 'Rust evangelist. Systems programmer. Memory safety ≠ slow.',
    location: 'Seattle, WA',
    skills: ['Rust', 'WebAssembly', 'C++', 'LLVM']
  }
];

const postsData = [
  {
    authorIdx: 0,
    content: 'Just shipped a new feature using React Server Components and it reduced our TTFB by 40%. The mental model is different but once it clicks — it\'s magic. 🚀\n\nKey takeaway: don\'t fight the framework, understand why it exists.',
    tags: ['react', 'webdev', 'performance'],
  },
  {
    authorIdx: 1,
    content: 'Spent the day debugging a race condition in a distributed Go service. The fix was 2 lines. The investigation was 6 hours.\n\nDistributed systems are humbling.',
    tags: ['golang', 'distributedsystems', 'debugging'],
    codeSnippet: {
      language: 'go',
      code: `// The bug: channel send without select + default
// goroutines were blocking indefinitely

// Fix: add timeout context
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()

select {
case ch <- result:
  // success
case <-ctx.Done():
  return ctx.Err()
}`
    }
  },
  {
    authorIdx: 2,
    content: 'Hot take: your Kubernetes cluster does NOT need 15 microservices for a team of 4 engineers. Start with a monolith. Split when you feel the pain, not before.\n\nPremature microservices is tech debt in disguise.',
    tags: ['kubernetes', 'devops', 'architecture'],
  },
  {
    authorIdx: 3,
    content: 'Design principle I live by: if you need a tooltip to explain a button, redesign the button.\n\nUI should be self-explanatory. Tooltips are a band-aid, not a solution.',
    tags: ['ux', 'design', 'frontend'],
  },
  {
    authorIdx: 4,
    content: 'Rust\'s ownership model finally clicked for me. It\'s not about memory management — it\'s about encoding data lifetimes into the type system.\n\nOnce you see it that way, the borrow checker becomes your ally, not your enemy.',
    tags: ['rust', 'programming', 'systems'],
    codeSnippet: {
      language: 'rust',
      code: `// Ownership is about expressing data lifetimes
struct Config<'a> {
    name: &'a str, // borrows from caller — no allocation!
}

fn process(config: Config<'_>) -> &str {
    config.name // lifetime is clear in the type
}

fn main() {
    let name = String::from("devlink");
    let cfg = Config { name: &name };
    println!("{}", process(cfg));
}`
    }
  },
  {
    authorIdx: 0,
    content: 'TypeScript tip: use `satisfies` operator instead of type assertions when you want type checking but need to keep the literal type.\n\nChanges everything for config objects.',
    tags: ['typescript', 'javascript', 'tips'],
    codeSnippet: {
      language: 'typescript',
      code: `// ❌ Type assertion loses literal types
const config = {
  env: "production",
  port: 3000
} as Config;

// ✅ satisfies checks AND preserves literals
const config = {
  env: "production",  // type: "production", not string
  port: 3000
} satisfies Config;

config.env; // "production" ← literal type preserved!`
    }
  },
  {
    authorIdx: 1,
    content: 'PostgreSQL window functions are criminally underused. I rewrote a 50-line Python script as a single SQL query using LAG() and PARTITION BY.\n\nLearn SQL deeply. It pays off.',
    tags: ['postgresql', 'sql', 'databases'],
  },
  {
    authorIdx: 2,
    content: 'After running Terraform in production for 3 years:\n\n• Always use remote state (S3 + DynamoDB lock)\n• Separate state per environment\n• `terraform plan` before every apply, always\n• Tag everything — future you will thank past you',
    tags: ['terraform', 'devops', 'infrastructure'],
  }
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Follow.deleteMany({}),
      Like.deleteMany({}),
      Comment.deleteMany({})
    ]);
    console.log('🧹 Cleared existing data');

    // Create users
    const createdUsers = await User.insertMany(users.map(u => ({ ...u })));
    // Re-query to get hashed passwords (insertMany doesn't run pre-save hooks for array)
    const savedUsers = [];
    for (const u of users) {
      const saved = await User.create(u);
      savedUsers.push(saved);
    }
    await User.deleteMany({ email: { $in: createdUsers.map(u => u.email) } });
    console.log(`👤 Created ${savedUsers.length} users`);

    // Create posts
    const savedPosts = [];
    for (const p of postsData) {
      const post = await Post.create({
        author: savedUsers[p.authorIdx]._id,
        content: p.content,
        tags: p.tags || [],
        codeSnippet: p.codeSnippet || {},
        visibility: 'public'
      });
      savedPosts.push(post);
      await User.findByIdAndUpdate(savedUsers[p.authorIdx]._id, { $inc: { postsCount: 1 } });
    }
    console.log(`📝 Created ${savedPosts.length} posts`);

    // Create follows (everyone follows alex_dev, and each other randomly)
    const followPairs = [
      [1, 0], [2, 0], [3, 0], [4, 0], // all follow alex_dev
      [0, 1], [0, 2], [0, 3],          // alex follows some
      [2, 1], [3, 1],                  // others follow sara
      [1, 2], [4, 2],
    ];

    for (const [followerIdx, followingIdx] of followPairs) {
      await Follow.create({
        follower: savedUsers[followerIdx]._id,
        following: savedUsers[followingIdx]._id
      });
      await User.findByIdAndUpdate(savedUsers[followerIdx]._id, { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(savedUsers[followingIdx]._id, { $inc: { followersCount: 1 } });
    }
    console.log(`👥 Created ${followPairs.length} follow relationships`);

    // Create some likes
    for (let i = 0; i < savedPosts.length; i++) {
      const likersCount = Math.floor(Math.random() * 4) + 1;
      const likers = savedUsers.slice(0, likersCount);
      for (const liker of likers) {
        if (liker._id.toString() === savedPosts[i].author.toString()) continue;
        await Like.create({ user: liker._id, targetType: 'post', targetId: savedPosts[i]._id });
        await Post.findByIdAndUpdate(savedPosts[i]._id, { $inc: { likesCount: 1 } });
      }
    }
    console.log('❤️ Created likes');

    // Create some comments
    const commentTexts = [
      'Great insight! Totally agree with this take.',
      'Been thinking about this too. The ecosystem has matured a lot.',
      'This saved me hours. Thanks for sharing!',
      'I had a similar experience. The tooling has come a long way.',
      'Couldn\'t agree more. Simplicity is underrated.',
    ];

    for (let i = 0; i < 3; i++) {
      const commenters = [savedUsers[1], savedUsers[2]];
      for (const commenter of commenters) {
        const comment = await Comment.create({
          post: savedPosts[i]._id,
          author: commenter._id,
          content: commentTexts[Math.floor(Math.random() * commentTexts.length)]
        });
        await Post.findByIdAndUpdate(savedPosts[i]._id, { $inc: { commentsCount: 1 } });
      }
    }
    console.log('💬 Created comments');

    console.log('\n🌱 Seed complete! Demo accounts:');
    savedUsers.forEach(u => console.log(`   @${u.username} / password123`));
    console.log('\n');

  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
