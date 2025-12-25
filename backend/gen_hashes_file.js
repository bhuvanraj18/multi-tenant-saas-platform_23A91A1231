const bcrypt = require('bcrypt');
const fs = require('fs');
(async () => {
    const admin = await bcrypt.hash('Demo@123', 10);
    const user = await bcrypt.hash('User@123', 10);
    const superAdmin = await bcrypt.hash('Admin@123', 10);
    const out = `ADMIN:${admin}\nUSER:${user}\nSUPER:${superAdmin}`;
    fs.writeFileSync('hashes_out.txt', out);
    console.log('Done');
})();
