// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// STATE
let currentUser = null;
let lang = 'RO';

// --- LANG TOGGLE ---
document.getElementById('langSwitch').addEventListener('click', () => {
  lang = (lang === 'RO') ? 'EN' : 'RO';
  renderLanguage();
});

function renderLanguage() {
  if(lang === 'RO'){
    document.querySelectorAll('[data-ro]').forEach(el=>{el.classList.remove('hidden');});
    document.querySelectorAll('[data-en]').forEach(el=>{el.classList.add('hidden');});
  } else {
    document.querySelectorAll('[data-ro]').forEach(el=>{el.classList.add('hidden');});
    document.querySelectorAll('[data-en]').forEach(el=>{el.classList.remove('hidden');});
  }
}

// --- LOGIN ADMIN / USER ---
window.loginUser = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    const userCredential = await signInWithEmailAndPassword(auth,email,password);
    currentUser = userCredential.user;
    loadUserPanel();
  } catch(e){ alert(e.message); }
}

// --- LOGOUT ---
window.logoutUser = async function(){
  await signOut(auth);
  location.reload();
}

// --- REGISTER WITH INVITE CODE ---
window.registerUser = async function(){
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('passwordConfirm').value;
  const invite = document.getElementById('inviteCode').value;
  const rules = document.getElementById('rulesCheck').checked;
  const faq = document.getElementById('faqCheck').checked;
  const adult = document.getElementById('adultCheck').checked;

  if(password!==confirm){ alert("Passwords do not match"); return; }
  if(!rules || !faq || !adult){ alert("You must agree to all checkboxes"); return; }

  // Verify email domain
  if(!email.match(/@(gmail\.com|outlook\.com|icloud\.com|yahoo\.com|protonmail\.com)$/i)){
    alert("Email invalid / not allowed"); return;
  }

  // Check invite code
  const q = query(collection(db,'inviteCodes'),where('code','==',invite));
  const snapshot = await getDocs(q);
  if(snapshot.empty){ alert("Invalid invite code"); return; }

  // Create user
  try{
    const userCredential = await createUserWithEmailAndPassword(auth,email,password);
    currentUser = userCredential.user;
    // Mark invite as used
    snapshot.forEach(async docSnap=>{
      await updateDoc(doc(db,'inviteCodes',docSnap.id),{usedBy: email, used:true});
    });
    loadUserPanel();
  } catch(e){ alert(e.message); }
}

// --- ADMIN CREATE INVITE CODE ---
window.createInviteCode = async function(){
  if(!currentUser || currentUser.email!=='bourosalexandru7@gmail.com'){ alert("Only admin"); return; }
  const code = Math.floor(100000 + Math.random()*900000).toString();
  await addDoc(collection(db,'inviteCodes'),{code, createdAt:new Date(), used:false, usedBy:null});
  alert("Invite code created: "+code);
}

// --- ADMIN UPLOAD FILE ---
window.uploadFile = async function(){
  if(!currentUser || currentUser.email!=='bourosalexandru7@gmail.com'){ alert("Only admin"); return; }
  const title = document.getElementById('fileTitle').value;
  const link = document.getElementById('fileLink').value;
  await addDoc(collection(db,'files'),{title, link, uploadedBy:currentUser.email, createdAt:new Date()});
  loadFiles();
}

// --- LOAD FILES ---
async function loadFiles(){
  const container = document.getElementById('fileList');
  container.innerHTML='';
  const snapshot = await getDocs(collection(db,'files'));
  snapshot.forEach(docSnap=>{
    const data = docSnap.data();
    const div = document.createElement('div');
    div.className='file-card';
    div.innerHTML=`<span>${data.title}</span><a href="${data.link}" target="_blank">Download</a>`;
    container.appendChild(div);
  });
}

// --- LOAD PANELS ---
function loadUserPanel(){
  document.getElementById('authPanel').classList.add('hidden');
  document.getElementById('userPanel').classList.remove('hidden');
  if(currentUser.email==='bourosalexandru7@gmail.com'){
    document.getElementById('adminPanel').classList.remove('hidden');
  }
  loadFiles();
}

window.onload = function(){
  renderLanguage();
}
