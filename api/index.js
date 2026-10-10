const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const mongoose = require('mongoose');
const app = require('../app');

let connectionPromise;

module.exports = async (req, res) => {
  try {
    if (!connectionPromise) {
      const DB = process.env.DATABASE.replace(
        '<PASSWORD>',
        process.env.DATABASE_PASSWORD,
      );

      connectionPromise = mongoose.connect(DB);
    }

    await connectionPromise;

    return app(req, res);
  } catch (err) {
    connectionPromise = undefined;
    console.error('Vercel application error:', err.message);

    return res.status(500).json({
      status: 'error',
      message: 'Unable to connect to the application database.',
    });
  }
};
