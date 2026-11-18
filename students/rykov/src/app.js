const express = require('express');
const path = require('path');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  let nextId = 4;
  const books = [
    { id: 1, title: 'Кобзар', author: 'Тарас Шевченко', year: 1840 },
    { id: 2, title: 'Тіні забутих предків', author: 'Михайло Коцюбинський', year: 1911 },
    { id: 3, title: 'Інтернат', author: 'Сергій Жадан', year: 2017 },
  ];

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: process.env.APP_VERSION || 'dev' });
  });

  app.get('/api/books', (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    const result = q
      ? books.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      : books;
    res.json(result);
  });

  app.get('/api/books/:id', (req, res) => {
    const book = books.find((b) => b.id === Number(req.params.id));
    if (!book) return res.status(404).json({ error: 'Книгу не знайдено' });
    res.json(book);
  });

  app.post('/api/books', (req, res) => {
    const { title, author, year } = req.body || {};
    if (!title || !author) {
      return res.status(400).json({ error: 'Поля title і author обов\'язкові' });
    }
    const book = { id: nextId++, title, author, year: year ? Number(year) : null };
    books.push(book);
    res.status(201).json(book);
  });

  app.delete('/api/books/:id', (req, res) => {
    const index = books.findIndex((b) => b.id === Number(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Книгу не знайдено' });
    books.splice(index, 1);
    res.status(204).end();
  });

  return app;
}

module.exports = { createApp };
