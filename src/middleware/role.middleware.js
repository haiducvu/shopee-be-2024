const AccessControl = require('accesscontrol');

// grant list fetched from DB (to be converted to a valid grants object, internally)
// let grantList = [
//     { role: 'admin', resource: 'profile', action: 'read:any', attributes: '*, !views' },
//     { role: 'admin', resource: 'profile', action: 'update:any', attributes: '*, !views' },
//     { role: 'admin', resource: 'profile', action: 'delete:any', attributes: '*, !views' },
//     { role: 'admin', resource: 'balance', action: 'read:any', attributes: '*, !views' },

//     { role: 'shop', resource: 'profile', action: 'read:own', attributes: '*' },
// ];
// module.exports = new AccessControl(grantList);
module.exports = new AccessControl();   