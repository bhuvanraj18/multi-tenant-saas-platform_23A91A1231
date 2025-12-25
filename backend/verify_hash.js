const bcrypt = require('bcrypt');

const seedHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
const password = 'Demo@123';

async function check() {
    console.log(`Checking password: ${password}`);
    console.log(`Against hash: ${seedHash}`);
    const match = await bcrypt.compare(password, seedHash);
    console.log(`Match: ${match}`);

    if (!match) {
        const newHash = await bcrypt.hash(password, 10);
        console.log(`Correct hash for '${password}': ${newHash}`);
    }
}

check();
