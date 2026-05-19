const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const FormData = require('form-data');
const fs = require('fs');


const testUpload = async () => {
    try {
        const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        // Create a dummy file
        const dummyPath = path.join(__dirname, 'dummy.txt');
        fs.writeFileSync(dummyPath, 'Hello World');

        const form = new FormData();
        form.append('client_id', '1');
        form.append('files', fs.createReadStream(dummyPath));

        console.log('Sending upload request...');
        const res = await fetch('http://localhost:5000/api/admin/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            },
            body: form
        });

        const text = await res.text();
        console.log('Response status:', res.status);
        console.log('Response body:', text);

        fs.unlinkSync(dummyPath);
    } catch (e) {
        console.error('Test error:', e);
    }
};

testUpload();
