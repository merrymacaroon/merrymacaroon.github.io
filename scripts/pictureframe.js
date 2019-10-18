$(document).ready(function() {

  $(".gallery .pictureframe").each(function(){
    $(this).css("order",Math.floor((Math.random() * 100)));
    $(this).css("transform","rotate(" + ((Math.random() * 2) - 1) + "deg)");

  });

  $(".gallery .pictureframe").click(function(){

    if ($(this).attr("zoomed") == "1") {
      $(this).attr("zoomed","0");
      $(".curtain").css("visibility","hidden");
      $(this).animate({
        width:$(this).attr("tempWidth")+"%",
      },500,
      function(){
        $(this).css({"position":"static",
          "z-index":"0"
        });
      });
    } else {

      // Google Analytics Event
      gtag('event','view_item',{'items':$(this).find("img").attr("alt")});

      $(this).attr("zoomed","1");
      $(this).attr("tempWidth",
        Math.floor($(this).width()/$(this).parent().width()*100));

      $(".curtain").css("visibility","visible");

      $(this).css({"position":"fixed",
        "top":"10px",
        "z-index":"2"
      });

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
