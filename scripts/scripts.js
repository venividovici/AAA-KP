function onClickToOutput() {
  //document.getElementById("loadingText").innerHTML = "Laddar…";
  loadingBlur();
  document.getElementById("next").disabled = true;
  location.href = "/loading";
}

function reload(){
  var spinner = document.createElement('i')
  spinner.className = "fa fa-refresh fa-spin"
  document.getElementById("reloadIcon").replaceWith(spinner);
}

function downloadFile(jsonContent){
  var blob = new Blob([jsonContent], {type: "application/json"});
  var fileLink = document.createElement('a');
  fileLink.href = window.URL.createObjectURL(blob);
  const date = new Date();
  fileLink.download =
    "AAA " +
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1) +
    "-" +
    date.getDate();
  fileLink.click();
}

function loadingBlur() {
  var element = document.getElementById("loadingBlur");
  element.classList.add("loadingBlur");

  var element2 = document.getElementById("loadingSymbol");
  element2.classList.add("lds-ellipsis");
}
