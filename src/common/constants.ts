type ConstantsKey = 'CHARACTERS' | 'INDENT';

export const Constants: { [key in ConstantsKey]: string } = {
  CHARACTERS:
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=+!@#$%^&*();:,<.>/?',
  INDENT: '    ',
};

export default Constants;
