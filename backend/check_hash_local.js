const bcrypt = require('bcrypt');
const fs = require('fs');

const hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
const candidates = ['password123', 'Admin@123', 'admin123', 'User@123'];

async function check() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    log(`Checking hash: ${hash}`);
    for (const p of candidates) {
        const match = await bcrypt.compare(p, hash);
        log(`Password: "${p}" => Match: ${match}`);
    }

    const newHash = await bcrypt.hash('password123', 10);
    log(`Generated hash for 'password123': ${newHash}`);

    fs.writeFileSync('hash_check_result.txt', output);
}

check();
