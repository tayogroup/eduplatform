const __PQ_NORMALIZE_UNIT_CONFIG__ = (
  (typeof window !== 'undefined' && window.PQUnitConfigNormalizer) ||
  (typeof globalThis !== 'undefined' && globalThis.PQUnitConfigNormalizer)
);

if (!__PQ_NORMALIZE_UNIT_CONFIG__ || typeof __PQ_NORMALIZE_UNIT_CONFIG__.normalize !== 'function') {
  throw new Error('PQUnitConfigNormalizer must load before unit.config.js');
}

const UNIT_CFG = __PQ_NORMALIZE_UNIT_CONFIG__.normalize({
  schemaVersion: 1,

  identity: {
    lessonId: '{{LESSON_ID}}',
    unitId: '{{UNIT_ID}}',
    unitKey: '{{UNIT_KEY}}',
    storagePrefix: '{{UNIT_ID}}',
    keyPrefix: '{{KEY_PREFIX}}'
  },

  moodle: {
    wsGetFunction: '{{WS_GET_FUNCTION}}',
    wsSetFunction: '{{WS_SET_FUNCTION}}'
  },

  release: {
    version: '0.1.0',
    assetVersion: '{{UNIT_KEY}}-v0.1.0'
  },

  assets: {
    cdnRoot: 'https://ehelacademy.b-cdn.net/pre_quraan',
    unitMediaRoot: '/lessons/{{UNIT_KEY}}/media',
    filePrefix: '{{KEY_PREFIX}}',
    mediaPadWidth: 2
  },

  steps: [],

  content: {
    items: []
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
}
