function onClickToOutput() {
  document.getElementById("loadingText").innerHTML = "Laddar…";
  location.href = "/loading";
}
function downloadFile(){
  var content = 'fnResponse'; 
  var blob = new Blob([content], {type: "text/csv"});
  var fileLink = document.createElement('a');
  fileLink.href = window.URL.createObjectURL(blob);
  const date = new Date(); 
  fileLink.download = 'AAA ' + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  fileLink.click();
 }