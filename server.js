import express from 'express';
import cors from 'cors';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 10000;

// Setup CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from /uploads
const UPLOADS_DIR = path.resolve('./uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({ storage });

const DATA_FILE = './posts.json';

// Helper to read/write JSON
function readPosts() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
function writePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

// GET all posts
app.get('/api/posts', (req, res) => {
  const posts = readPosts();
  res.json(posts);
});

// POST a new post (with image upload)
app.post('/api/posts', upload.single('image'), (req, res) => {
  const posts = readPosts();
  const { name, message } = req.body;
  let imageUrl = '';
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  }
  const newPost = {
    id: uuidv4(),
    name,
    message,
    imageUrl,
    createdAt: new Date().toISOString()
  };
  posts.push(newPost);
  writePosts(posts);
  res.json(newPost);
});

// DELETE a post by id
app.delete('/api/posts/:id', (req, res) => {
  const posts = readPosts();
  const id = req.params.id;
  const index = posts.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  // Optionally remove the image file
  const post = posts[index];
  if (post.imageUrl) {
    const imageFile = path.join(UPLOADS_DIR, path.basename(post.imageUrl));
    if (fs.existsSync(imageFile)) {
      fs.unlinkSync(imageFile);
    }
  }
  posts.splice(index, 1);
  writePosts(posts);
  res.json({ message: 'Post deleted' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
