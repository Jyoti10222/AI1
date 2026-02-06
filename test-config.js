// Quick test script to verify config files are being read correctly
const fs = require('fs');
const path = require('path');

function testCybersecurityConfig() {
    const configPath = path.join(__dirname, 'cybersecurity-config.json');
    console.log('Reading from:', configPath);
    console.log('File exists:', fs.existsSync(configPath));

    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('\n=== Cybersecurity Config Structure ===');
        console.log('Has career:', !!config.career);
        console.log('Has career.programs:', !!config.career?.programs);
        console.log('Career programs count:', config.career?.programs?.length || 0);
        console.log('Has upskilling:', !!config.upskilling);
        console.log('Has upskilling.programs:', !!config.upskilling?.programs);
        console.log('Upskilling programs count:', config.upskilling?.programs?.length || 0);
        console.log('Has modular:', !!config.modular);
        console.log('Has modular.programs:', !!config.modular?.programs);
        console.log('Modular programs count:', config.modular?.programs?.length || 0);

        if (config.career?.programs?.length > 0) {
            console.log('\nFirst career program:', config.career.programs[0].title);
        }
    }
}

function testNetworkingConfig() {
    const configPath = path.join(__dirname, 'networking-config.json');
    console.log('\n\nReading from:', configPath);
    console.log('File exists:', fs.existsSync(configPath));

    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('\n=== Networking Config Structure ===');
        console.log('Has career:', !!config.career);
        console.log('Has career.programs:', !!config.career?.programs);
        console.log('Career programs count:', config.career?.programs?.length || 0);
        console.log('Has upskilling:', !!config.upskilling);
        console.log('Has upskilling.programs:', !!config.upskilling?.programs);
        console.log('Upskilling programs count:', config.upskilling?.programs?.length || 0);
        console.log('Has modular:', !!config.modular);
        console.log('Has modular.programs:', !!config.modular?.programs);
        console.log('Modular programs count:', config.modular?.programs?.length || 0);

        if (config.career?.programs?.length > 0) {
            console.log('\nFirst career program:', config.career.programs[0].title);
        }
    }
}

console.log('='.repeat(60));
console.log('TESTING CONFIG FILES');
console.log('='.repeat(60));

testCybersecurityConfig();
testNetworkingConfig();

console.log('\n' + '='.repeat(60));
console.log('TEST COMPLETE');
console.log('='.repeat(60));
