function onClickToOutput() {
  document.getElementById("loadingText").innerHTML = "Laddar…";
  document.getElementById("next").disabled = true;
  location.href = "/loading";
}

function downloadFile(jsonContent){
  var blob = new Blob([jsonContent], {type: "application/json"});
  var fileLink = document.createElement('a');
  fileLink.href = window.URL.createObjectURL(blob);
  const date = new Date(); 
  fileLink.download = 'AAA ' + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  fileLink.click();
 }