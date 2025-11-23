import express from 'express';
import cors from 'cors';
import createSampleSetRouter from './api/createSampleSet.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', createSampleSetRouter);

const server = app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the existing process or use a different port.`);
    console.error(`To find and kill the process: netstat -ano | findstr :${PORT}`);
    process.exit(1);
  } else {
    throw err;
  }
});
