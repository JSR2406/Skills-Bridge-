const crypto = require('crypto');
const p = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const pub = p.publicKey.export({ type: 'spki', format: 'der' });
const priv = p.privateKey.export({ type: 'pkcs8', format: 'der' });
console.log('VAPID_PUBLIC_KEY=' + pub.slice(27).toString('base64url'));
console.log('VAPID_PRIVATE_KEY=' + priv.slice(36, 68).toString('base64url'));
