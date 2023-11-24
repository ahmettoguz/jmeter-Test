// script.js
const form = document.getElementById("form");
const btnCheckServer = document.getElementById("checkServer");

form.addEventListener("submit", submitForm);
btnCheckServer.addEventListener("click", checkServer);

// const url = "http://localhost";
const url = "http://138.68.78.220"; 

function checkServer(e) {
  e.preventDefault();
  $.ajax({
    url: url,
    type: "GET",
    contentType: false,
    processData: false,
    cache: false,
    dataType: "json",
    success: function (response) {
      console.log(response);
      const out = JSON.stringify(response, null, 3);
      $("#res").html("<pre>" + out + "</pre>");

      $("#res").removeClass("error");
      $("#res").addClass("success");
    },
    error: function (response) {

      console.log(response);
      const out = JSON.stringify(response, null, 3);
      $("#res").html("<pre>" + out + "</pre>");

      $("#res").removeClass("success");
      $("#res").addClass("error");
    },
  });
}

function submitForm(e) {
  e.preventDefault();

  let file = $("#file")[0].files[0];
  let cloudProvider = $("#cloudProvider").val();
  let virtualUser = $("#virtualUser").val();
  var ajaxData = new FormData();

  ajaxData.append("virtualUser", virtualUser);
  ajaxData.append("cloudProvider", cloudProvider);
  ajaxData.append("jmxFile", file);

  $.ajax({
    url: `${url}/runTest`,
    type: "POST",
    contentType: false,
    processData: false,
    cache: false,
    dataType: "json",
    enctype: "multipart/form-data",
    data: ajaxData,
    success: function (response) {
      console.log(response);
      const out = JSON.stringify(response, null, 3);
      $("#res").html("<pre>" + out + "</pre>");

      $("#res").removeClass("error");
      $("#res").addClass("success");
    },
    error: function (response) {
      console.log(response);
      const out = JSON.stringify(response.responseJSON, null, 3);
      $("#res").html("<pre>" + out + "</pre>");

      $("#res").addClass("error");
      $("#res").removeClass("success");
    },
  });
}
