var invocation = new XMLHttpRequest();
var url = 'https://sipu.iptime.org/json/dataperson.json';
   
function callOtherDomain() {
  if(invocation) {    
    invocation.open('GET', url, true);
    invocation.withCredentials = false;
    invocation.onreadystatechange = handler;
    invocation.send(); 
  }
}

function handler() {
    if (invocation.readyState === XMLHttpRequest.DONE) {
        if (invocation.status === 200) {
          console.log(invocation.responseText);
        } else {
          console.log('request에 뭔가 문제가 있어요.');
        }
      }
}

var s = document.getElementsByTagName("button");
s[0].addEventListener("click", function (e){
    callOtherDomain();

},false);
