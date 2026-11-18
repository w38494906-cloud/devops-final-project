const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;

createApp().listen(PORT, () => {
  console.log(`Book catalog is running on port ${PORT}`);
});
