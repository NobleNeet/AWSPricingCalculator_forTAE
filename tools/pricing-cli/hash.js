import { createHash } from 'node:crypto';

export const checksum = text => createHash('sha256').update(text).digest('hex');
