import { upload } from './api.js';

export const uploadHoldingsCSV = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return upload('/upload/holdings-csv', fd);
};

export const uploadTransactionsCSV = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return upload('/upload/transactions-csv', fd);
};

export const uploadScreenshot = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return upload('/upload/image', fd);
};
