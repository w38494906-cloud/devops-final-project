const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

let server;
let base;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test('GET /health returns ok', async () => {
  const res = await fetch(`${base}/health`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).status, 'ok');
});

test('GET /api/books returns list', async () => {
  const books = await (await fetch(`${base}/api/books`)).json();
  assert.ok(books.length >= 3);
});

test('search by author works', async () => {
  const books = await (await fetch(`${base}/api/books?q=жадан`)).json();
  assert.strictEqual(books.length, 1);
  assert.strictEqual(books[0].title, 'Інтернат');
});

test('POST validates required fields', async () => {
  const res = await fetch(`${base}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Без автора' }),
  });
  assert.strictEqual(res.status, 400);
});

test('POST and DELETE a book', async () => {
  const res = await fetch(`${base}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Лісова пісня', author: 'Леся Українка', year: 1911 }),
  });
  assert.strictEqual(res.status, 201);
  const book = await res.json();

  const del = await fetch(`${base}/api/books/${book.id}`, { method: 'DELETE' });
  assert.strictEqual(del.status, 204);

  const after = await fetch(`${base}/api/books/${book.id}`);
  assert.strictEqual(after.status, 404);
});
