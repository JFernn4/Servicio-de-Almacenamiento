import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 10;

export const hashPassword = (contrasena) => bcrypt.hash(contrasena, BCRYPT_SALT_ROUNDS);

export const verifyPassword = (contrasena, hash) => bcrypt.compare(contrasena, hash);
