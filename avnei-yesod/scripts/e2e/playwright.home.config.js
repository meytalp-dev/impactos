// קונפיג עוקף לבדיקות תרגול-בית כשפורט 8765 תפוס ע"י שרת אחר (סוכנים מקבילים).
// זהה ל-playwright.config.js פרט ל-baseURL. שימוש:
//   npx playwright test 19-home-practice --config playwright.home.config.js
const base = require('./playwright.config.js');

module.exports = {
  ...base,
  use: { ...base.use, baseURL: 'http://localhost:8770' },
};
