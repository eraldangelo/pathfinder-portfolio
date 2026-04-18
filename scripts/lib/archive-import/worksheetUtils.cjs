const { normalizeKey, toCellString } = require('./valueUtils.cjs');

const indexHeaders = (worksheet) => {
  const headerValues = worksheet.getRow(1).values.slice(1).map((value) => toCellString(value));
  const indexByKey = new Map();
  headerValues.forEach((value, index) => {
    indexByKey.set(normalizeKey(value), index + 1);
  });
  return indexByKey;
};

module.exports = {
  indexHeaders,
};
