// ===== Firebase Config =====
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== Авторизация Google =====
document.getElementById('loginBtn').addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(result => {
    const user = result.user;
    const playerRef = db.collection('players').doc(user.uid);
    playerRef.get().then(doc => {
      if(!doc.exists){
        playerRef.set({
          name: user.displayName,
          xp: 0,
          level: 1,
          rank: "Anfänger",
          streak: 0,
          wins: 0,
          lastLogin: firebase.firestore.Timestamp.now()
        });
      }
    });
    document.getElementById('menu').style.display='block';
    document.getElementById('loginBtn').style.display='none';
  });
});

// ===== Слова =====
let wordList = [];
db.collection('words').get().then(snapshot => {
  snapshot.forEach(doc => wordList.push(doc.data()));
});

// ===== Игра =====
document.getElementById('playBtn').addEventListener('click',()=>{
  document.getElementById('gameArea').style.display='block';
  document.getElementById('customArea').style.display='none';
  loadWord();
});

function loadWord(){
  if(wordList.length === 0) return;
  const word = wordList[Math.floor(Math.random()*wordList.length)];
  document.getElementById('wordCard').innerText = word.german;

  const optionsDiv = document.getElementById('options');
  optionsDiv.innerHTML='';

  const choices = [word.translation, "неправ1","неправ2","неправ3"];
  choices.sort(()=> Math.random()-0.5);

  choices.forEach(opt=>{
    const btn = document.createElement('button');
    btn.innerText=opt;
    btn.onclick=()=>{
      const uid=auth.currentUser.uid;
      if(opt===word.translation){
        alert("✅ Правильно! +5 XP");
        updateXP(uid,5);
      } else {
        alert("❌ Неправильно! Попробуй снова");
      }
      loadWord();
    };
    optionsDiv.appendChild(btn);
  });
}

// ===== XP и ранги =====
function updateXP(uid,points){
  const playerRef = db.collection('players').doc(uid);
  playerRef.get().then(doc=>{
    let data=doc.data();
    let newXP=data.xp+points;
    let newLevel=Math.floor(newXP/50)+1;
    let newRank;
    if(newLevel<=2)newRank="Anfänger";
    else if(newLevel<=4)newRank="Lernender";
    else if(newLevel<=6)newRank="Profi";
    else if(newLevel<=8)newRank="Experte";
    else if(newLevel<=10)newRank="Meister";
    else newRank="Legende";
    playerRef.update({xp:newXP,level:newLevel,rank:newRank});
  });
}

// ===== Личные слова =====
document.getElementById('customBtn').addEventListener('click',()=>{
  document.getElementById('customArea').style.display='block';
  document.getElementById('gameArea').style.display='none';
  loadCustomWords();
});

document.getElementById('addCustomBtn').addEventListener('click',()=>{
  const german=document.getElementById('germanWord').value;
  const translation=document.getElementById('translationWord').value;
  if(!german || !translation) return;
  const uid=auth.currentUser.uid;
  db.collection('customWords').doc(uid).set({
    [german]:{german,translation}
  },{merge:true});
  document.getElementById('germanWord').value='';
  document.getElementById('translationWord').value='';
  loadCustomWords();
});

function loadCustomWords(){
  const uid=auth.currentUser.uid;
  db.collection('customWords').doc(uid).get().then(doc=>{
    const listDiv=document.getElementById('customList');
    listDiv.innerHTML='';
    if(doc.exists){
      Object.values(doc.data()).forEach(w=>{
        const div=document.createElement('div');
        div.innerText=`${w.german} → ${w.translation}`;
        listDiv.appendChild(div);
      });
    }
  });
}
