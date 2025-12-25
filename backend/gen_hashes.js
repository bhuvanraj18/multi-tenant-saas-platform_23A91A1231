const bcrypt = require('bcrypt');
(async () => {
    console.log('ADMIN_HASH:' + await bcrypt.hash('Demo@123', 10));
    console.log('USER_HASH:' + await bcrypt.hash('User@123', 10));
    console.log('SUPER_HASH:' + await bcrypt.hash('Admin@123', 10));
})();
