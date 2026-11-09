const encoder=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export const randomToken=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export async function digest(text){return hex(await crypto.subtle.digest('SHA-256',encoder.encode(text)))}
async function derive(password,salt){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:100000,salt:encoder.encode(salt)},key,256))}
export async function hashPassword(password){const salt=randomToken();return salt+':'+await derive(password,salt)}
export async function equalToken(a,b){const key=await crypto.subtle.importKey('raw',new Uint8Array(32),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);const sig=await crypto.subtle.sign('HMAC',key,encoder.encode(a));return crypto.subtle.verify('HMAC',key,sig,encoder.encode(b))}
export async function verifyPassword(password,encoded){const [salt,expected]=encoded.split(':');return equalToken(await derive(password,salt),expected)}
