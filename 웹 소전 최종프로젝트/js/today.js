let today = new Date();   

let month = today.getMonth() + 1;
let date = today.getDate();

today = `${month}/${date}`;

const planMessage = document.getElementById('planOfTheDay');
planMessage.innerText = `${today} 팀에서의 계획`