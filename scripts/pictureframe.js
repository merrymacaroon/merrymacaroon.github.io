$(document).ready(function() {

  var colours = ["#ffe0e0","#d0ffd0","#e8e8ff"];
  // randomize colortape, order and tilt of pictureframes
  $(".pictureframe").each(function(){
    $(this).css("transform","rotate(" + ((Math.random() * 2) - 1) +
        "deg) translateY(" + (Math.floor(Math.random() * 20) - 10) + "px)");
    $(this).css("--color",colours[Math.floor((Math.random() * 3))]);
  });
  $(".gallery .pictureframe").each(function(){
    $(this).css("order",Math.floor((Math.random() * 100)));
  });

  $(".gallery .pictureframe").click(function(){

    // get image name before resolution specifyer
    var filename = $(this).find("img").attr("src");
    var i = filename.search("_");
    var rootFilename = filename.slice(0,i);

    if ($(this).attr("zoomed") == "1") {
      // switch to smaller image
      $(this).find("img").attr("src", rootFilename + "_500px.jpg");
      $(this).attr("zoomed","0");
      $(this).animate({
        width:$(this).attr("tempWidth")+"%",
      },500,
      function(){
        $(this).css({"position":"static",
          "z-index":"0"
        });
        $(".curtain").css("visibility","hidden");
      });
    } else {

      // Google Analytics Event
      gtag('event','click',{
        'event_cataegory':'gallery_view',
        'event_label':$(this).find("img").attr("alt")
      });

      // switch to larget image
      $(this).find("img").attr("src", rootFilename + "_2000px.jpg");

      $(this).attr("zoomed","1");
      $(this).attr("tempWidth",
        Math.floor($(this).width()/$(this).parent().width()*100));

      $(".curtain").css("visibility","visible");

      $(this).css({"position":"fixed",
        "top":"20px",
        "z-index":"2"
      });

      // calculate required zoom based on aspect ratio
      var elAspect = $(this).width()/$(this).height();
      var screenAspect = $(window).width()/$(window).height();
      var targetWidth;
      if (elAspect > screenAspect) {
        targetWidth = "90%";
      } else {
        targetWidth = 90*elAspect/screenAspect+"%";
      }

      $(this).animate({
        width:targetWidth,
      },500);
    }
  });
});
