$(document).ready(function() {

  // Converts the first char of var inputText to unicode based
  // on the format in var format
  function transposeCharToUnicode(inputText, format) {
    var offset=0;

    if (format == "I")
    {
      // offset for italic unicode

      // italic serif
      // offset = 0x1D434 - 0x47;

      // italic sans serif
      offset = 0x1D608 - 0x47;

    }
    else if (format == "B")
    {
      // offset for bold unicode

      // bold serif
      // offset = 0x1D400- 0x47;

      //bold sans serif
      offset = 0x1D5D4- 0x47;
    }
    else if (format == "X")
    {
      // offset for bold italic unicode

      // bold italic serif
      // offset = 0x1D468- 0x47;

      // bold italic sans serif
      offset = 0x1D63C- 0x47;
    }
    else if (format == "C")
    {
      // offset for cursive bold unicode

      // bold cursive
      offset = 0x1D4D0- 0x47;
    }

    // return appropriate uncode string
    if (inputText.charAt(0) >= "A" && inputText.charAt(0) <= "Z")
      return (inputText.charCodeAt(0)+offset + 6).toString(16);
    else if (inputText.charAt(0) >= "a" && inputText.charAt(0) <= "z")
      return (inputText.charCodeAt(0)+offset).toString(16);
    else return inputText.charAt(0); // fallthrough: return inputText

  }

  // Converts the string in var inputText to unicode string based
  // on the format in var format
  function transposeStringToUnicode(inputText, format) {
    var convertedText ="";
    var transposedChar;

    for (var i = 0; i < inputText.length; i++) {
      transposedChar = transposeCharToUnicode(inputText.charAt(i),format)
      if (transposedChar.length > 1)
        convertedText += "&#x"+transposedChar+";"; // successful transpose to unicode
      else
        convertedText += transposedChar; // failed transpose
    }
    return convertedText;
  }

  function transpose(){
    var convertedText;

    // clear previous outputText
    $("#italicText").text("");
    $("#boldText").text("");
    $("#boldItalicText").text("");
    $("#cursiveText").text("");

    // Transpose italic
    $("#italicText").append(transposeStringToUnicode($("#inputText").val(),"I"));
    // Transpose bold
    $("#boldText").append(transposeStringToUnicode($("#inputText").val(),"B"));
    // Transpose bold italic
    $("#boldItalicText").append(transposeStringToUnicode($("#inputText").val(),"X"));
    // Transpose bold cursive
    $("#cursiveText").append(transposeStringToUnicode($("#inputText").val(),"C"));

    if ($("#inputText").val().length == 0) {
      $("#italicText").html("&nbsp;");
      $("#boldText").html("&nbsp;");
      $("#boldItalicText").html("&nbsp;");
      $("#cursiveText").html("&nbsp;");
    }
    // grow input textarea when needed
    $("#inputText").height($("#boldItalicText").height());
  }

  // Transpose event handlers
  $("#inputText").keyup(transpose);
  $("#inputText").click(function(){
    gtag('event','click',{
      'event_cataegory':'translate_input',
      'event_label':$(this).attr("id")
    });
  });


  // Google Analytics Events
  $(".outputText").on("copy",function(){
    gtag('event','click',{
      'event_cataegory':'translate_output',
      'event_label':$(this).attr("id")
    });
  });

});
