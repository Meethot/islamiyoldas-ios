import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// eslint-plugin-react kurulamıyor (repoda @capacitor/core peer çakışması var).
// Bu yerel kural onun `jsx-uses-vars` davranışını verir: JSX'te kullanılan bileşen
// import'ları artık "unused" sayılmaz. Gerçekten ölü importlar uyarı vermeye devam eder.
const localReact = {
  rules: {
    'jsx-uses-vars': {
      meta: { type: 'problem', schema: [] },
      create(context) {
        return {
          JSXOpeningElement(node) {
            let name = node.name
            while (name.type === 'JSXMemberExpression') name = name.object
            if (name.type === 'JSXIdentifier') {
              context.sourceCode.markVariableAsUsed(name.name, node)
            }
          },
        }
      },
    },
  },
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    ignores: ['dist/**', 'android/**', 'ios/**', 'build/**', 'node_modules/**'],
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: { 'local-react': localReact },
    rules: {
      'local-react/jsx-uses-vars': 'error',
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'no-async-promise-executor': 'off',
      'no-empty': 'off',
    },
  },
])
