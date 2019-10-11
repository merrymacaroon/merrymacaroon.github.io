$(document).ready(function() {
  $(".pictureframe").each(function(){
    $(this).css("transform","rotate(" + ((Math.random() * 2) - 1) + "deg)");
  });

});
