module.exports = function (wallaby) {
  return {
    files: [
      'src/*.tsx'
    ],

    tests: [
      'src/tests/*.tsx'
    ],

    env: {
      type: 'node'
    },

    compilers: {
      '**/*.ts?(x)': wallaby.compilers.typeScript({ jsx: 'react', module: 'commonjs' })
    },

    testFramework: 'jest'
  };
};