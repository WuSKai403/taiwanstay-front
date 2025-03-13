// 模擬 nanoid 函數
function nanoid(size = 21) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let id = '';
  for (let i = 0; i < size; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

module.exports = { nanoid };