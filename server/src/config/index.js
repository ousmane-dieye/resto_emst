export const config = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'smartresto_esmt_secret_2024',
  JWT_EXPIRES_IN: '24h',
  QR_CODE_EXPIRY: 2 * 60 * 60 * 1000,
  POINTS_COMMANDE: 10,
  POINTS_FEEDBACK: 5,
  SEUIL_NIVEAUX: {
    BRONZE: 0,
    ARGENT: 200,
    OR: 500,
  },
}