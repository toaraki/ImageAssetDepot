const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// テンプレートエンジンとしてEJSを設定
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 永続ボリューム（PV）を想定したディレクトリ
// const UPLOAD_DIR = path.join(__dirname, 'public');
// const DB_PATH = path.join(__dirname, 'db', 'images.db');
const UPLOAD_DIR = path.join('/data', 'public');
const DB_PATH = path.join('/data', 'db', 'images.db');
// ディレクトリがなければ作成
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// SQLite3データベースの初期化
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        original_name TEXT NOT NULL,
        weight INTEGER DEFAULT 1
      )
    `);
  }
});

// Multerの設定：画像アップロード
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // ファイル名の重複を避けるためにタイムスタンプを追加
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.static(UPLOAD_DIR)); // 画像配信用の静的ファイルサーバー

// --- 画像管理用API ---

// 画像アップロードAPI
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  const { originalname, filename } = req.file;
  const weight = req.body.weight || 1; // 重み付けはデフォルト1

  db.run('INSERT INTO images (filename, original_name, weight) VALUES (?, ?, ?)',
    [filename, originalname, weight],
    function (err) {
      if (err) {
        // 重複エラーなど
        fs.unlink(req.file.path, () => {}); // アップロードしたファイルを削除
        return res.status(500).json({ error: 'Database error.', message: err.message });
      }
      res.status(201).json({
        message: 'Image uploaded successfully.',
        id: this.lastID,
        filename: filename
      });
    });
});

// 画像一覧表示API（サムネイル表示用）
app.get('/api/images', (req, res) => {
  db.all('SELECT * FROM images', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error.', message: err.message });
    }
    // クライアント側で利用しやすいようにURLを付加
    const imagesWithUrls = rows.map(row => ({
      ...row,
      url: `/public/${row.filename}`
    }));
    res.json(imagesWithUrls);
  });
});

// 画像情報更新API（重み付け変更など）
app.put('/api/images/:id', (req, res) => {
  const { weight } = req.body;
  const { id } = req.params;

  if (weight === undefined) {
    return res.status(400).json({ error: 'Weight is required.' });
  }

  db.run('UPDATE images SET weight = ? WHERE id = ?', [weight, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error.', message: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Image not found.' });
    }
    res.json({ message: 'Image updated successfully.' });
  });
});

// 画像削除API
app.delete('/api/images/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT filename FROM images WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error.', message: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Image not found.' });
    }

    // ファイルシステムから画像ファイルを削除
    const filePath = path.join(UPLOAD_DIR, row.filename);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Failed to delete file:', err);
      }
      // データベースからエントリを削除
      db.run('DELETE FROM images WHERE id = ?', [id], function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error.', message: err.message });
        }
        res.json({ message: 'Image deleted successfully.' });
      });
    });
  });
});

// 新規追加: 管理画面のルート
app.get('/admin', (req, res) => {
  db.all('SELECT * FROM images', [], (err, rows) => {
    if (err) {
      return res.status(500).send('Database error.');
    }
    // EJSテンプレートにデータを渡してレンダリング
    res.render('admin', { images: rows });
  });
});

// 新規追加: 画像の重み付けを更新するAPI
app.post('/admin/update-weight', (req, res) => {
    const { id, weight } = req.body;
    db.run('UPDATE images SET weight = ? WHERE id = ?', [weight, id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, changes: this.changes });
    });
});

// --- アプリケーション向けエンドポイント ---

// ランダムな画像配信API（重み付け考慮）
app.get('/public/medal_random.png', (req, res) => {
  db.all('SELECT filename, weight FROM images', [], (err, rows) => {
    if (err || !rows || rows.length === 0) {
      return res.status(404).send('No images found.');
    }

    // 重み付けに基づいたランダム選択
    const weightedImages = [];
    rows.forEach(row => {
      for (let i = 0; i < row.weight; i++) {
        weightedImages.push(row.filename);
      }
    });

    const randomFilename = weightedImages[Math.floor(Math.random() * weightedImages.length)];
    const filePath = path.join(UPLOAD_DIR, randomFilename);

    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).send('File not found.');
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`Image server listening on port ${PORT}`);
});