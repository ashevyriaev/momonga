const auth = require('./auth');
const category = require('./category');
const country = require('./country');
const forAll = require('./forAll');
const group = require('./group');
const invitation = require('./invitation');
const purchase = require('./purchase');
const user = require('./user');

module.exports = {
    forAll,
    api: {
        auth,
        category,
        country,
        group,
        invitation,
        purchase,
        user
    }
};