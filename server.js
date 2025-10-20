import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const DATA_FILE = path.join(process.cwd(), 'posts.json');

// Helper functions
function readPosts() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}
function writePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

// GET all posts
app.get('/api/posts', (req, res) => {
  res.json(readPosts());
});

// POST a new post
app.post('/api/posts', upload.single('image'), (req, res) => {
  const { studentName, famousName, blogContent, url, img } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : (img || null);
  const newPost = { 
    _id: uuidv4(), 
    studentName, 
    famousName, 
    blogContent: blogContent || "", 
    url: url || "#", 
    img: imageUrl, 
    createdAt: Date.now() 
  };
  const posts = readPosts();
  posts.push(newPost);
  writePosts(posts);
  res.json(newPost);
});

// DELETE a post
app.delete('/api/posts/:id', (req, res) => {
  let posts = readPosts();
  posts = posts.filter(p => p._id !== req.params.id);
  writePosts(posts);
  res.json({ message: 'Deleted successfully' });
});

// Serve uploaded images
app.use('/uploads', express.static(uploadsDir));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
