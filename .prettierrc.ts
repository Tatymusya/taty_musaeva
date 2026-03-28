import type { Options } from 'prettier';

const config: Options = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  endOfLine: 'lf',
  arrowParens: 'avoid',
  bracketSpacing: true,
  vueIndentScriptAndStyle: true,
  proseWrap: 'preserve',
  embeddedLanguageFormatting: 'auto',
};

export default config;
