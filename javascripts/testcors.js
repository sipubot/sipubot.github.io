var invocation = new XMLHttpRequest();
var url = 'https://sipu.iptime.org/Sipu/TestCors';
   
function callOtherDomain() {
  if(invocation) {    
    invocation.open('GET', url, true);
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

document.getElementById('co').click(function (){
    callOtherDomain();

});