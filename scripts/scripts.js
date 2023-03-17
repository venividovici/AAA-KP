function onClickToOutput() {
  loadingBlur();
  document.getElementById("next").disabled = true;
  location.href = "/generate";
}

function reload() {
  var spinner = document.createElement('i')
  spinner.className = "fa fa-refresh fa-spin"
  document.getElementById("reloadIcon").replaceWith(spinner);
}

function downloadFile(jsonContent) {
  var blob = new Blob([jsonContent], { type: "application/json" });
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
  var blur = document.getElementById("loadingBlur");
  var text = document.getElementById("loadingText");
  blur.classList.add("loadingBlur");
  text.innerHTML = "Vänligen vänta, analysen kan ta upp till 5 minuter.";
  var symbol = document.getElementById("loadingSymbol");
  symbol.classList.add("lds-ellipsis");
}
