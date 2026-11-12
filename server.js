const app = require('./src/app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Ferretería BN listo en el puerto ${PORT}`);
});
