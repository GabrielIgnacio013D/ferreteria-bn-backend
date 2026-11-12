const app = require('./src/app');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('Falta JWT_SECRET en el .env (mínimo 32 caracteres). El servidor no se inicia sin él.');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Ferretería BN listo en el puerto ${PORT}`);
});
