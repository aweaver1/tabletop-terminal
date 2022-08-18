type ConstantsKey =
  | 'CHARACTERS'
  | 'INDENT'
  | 'LOGIN_PREFIX'
  | 'PASSWORD_PREFIX';

export const Constants: { [key in ConstantsKey]: string } = {
  CHARACTERS:
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=+!@#$%^&*();:,<.>/?',
  INDENT: '    ',
  LOGIN_PREFIX: 'login: ',
  PASSWORD_PREFIX: 'password: ',
};

export default Constants;
