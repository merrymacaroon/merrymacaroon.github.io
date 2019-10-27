$(document).ready(function() {

  // array to hold all translators
  var translatorList = [];

  // class to implement translators
  class asciiToUnicodeTranslator {

    displayName = "";
    outputTextID = "";
    offset = 0;
    dictionary = {};

    constructor(unicodeInitialization) {
      if (unicodeInitialization.offset == 0) {
        dictionary = unicodeInitialization.dictionary;
      } else {
        this.offset = unicodeInitialization.offset;
      }
      this.displayName = unicodeInitialization.displayName;
      this.outputTextID = unicodeInitialization.outputTextID;
    }

    writeHTML() {
      return this.displayName;
    }

    translateCharToUnicode(inputChar) {
      if (this.offset > 0) {
        // use offset
        if (inputChar.charAt(0) >= "A" && inputChar.charAt(0) <= "Z")
          return (inputChar.charCodeAt(0)+this.offset + 6).toString(16);
        else if (inputChar.charAt(0) >= "a" && inputChar.charAt(0) <= "z")
          return (inputChar.charCodeAt(0)+this.offset).toString(16);
        else return inputChar.charAt(0); // fallthrough: return inputText
      } else {
        // use dictionary for non-contiguous ranges
        return inputChar.charAt(0); // fallthrough: return inputText
      }
    }

    translateStringToUnicode(inputString) {
      var convertedText ="";
      var transposedChar;

      for (var i = 0; i < inputString.length; i++) {
        transposedChar = this.translateCharToUnicode(inputString.charAt(i));
        if (transposedChar.length > 1)
          convertedText += "&#x"+transposedChar+";"; // successful transpose to unicode
        else
          convertedText += transposedChar; // failed transpose
      }
      return convertedText;
    }

    transpose(inputString) {
      $(this.outputTextID).text("");
      if (inputString.length == 0) {
        $(this.outputTextID).html("&nbsp;");
      } else {
        $(this.outputTextID).append(this.translateStringToUnicode(inputString));;
      }
    }
  }


  function transpose(){

     translatorList.forEach(function(translator, index, array){
       translator.transpose($("#inputText").val());
     });

    // grow input textarea when needed
    if ($("#inputText")[0].scrollHeight > $("#inputText")[0].clientHeight) {
      $("#inputText").height($("#inputText")[0].scrollHeight);
    }

  }

  // initilize
  function initialize (){
    var italicUnicodeInitialization = {
      offset : (0x1D608 - 0x47),
      displayName : "<h1 id='italicFont'><i>Italic</i></h1><p id='italicText' class='outputText'>&nbsp;</p>",
      outputTextID : "#italicText",
    };
    var boldUnicodeInitialization = {
      offset : (0x1D5D4 - 0x47),
      displayName : "<h1 id='boldFont'><b>Bold</b></h1><p id='boldText' class='outputText'>&nbsp;</p>",
      outputTextID : "#boldText",
    };
    var boldItalicUnicodeInitialization = {
      offset : (0x1D63C - 0x47),
      displayName : "<h1 id='boldItalicFont'><i><b>Bold Italic</b></i></h1><p id='boldItalicText' class='outputText'>&nbsp;</p>",
      outputTextID : "#boldItalicText",
    };
    var cursiveUnicodeInitialization = {
      offset : (0x1D4D0 - 0x47),
      displayName : "<h1 id='cursiveFont'>Cursive</h1><p id='cursiveText' class='outputText'>&nbsp;</p>",
      outputTextID : "#cursiveText",
    };

    translatorList.push(new asciiToUnicodeTranslator(italicUnicodeInitialization));
    translatorList.push(new asciiToUnicodeTranslator(boldUnicodeInitialization));
    translatorList.push(new asciiToUnicodeTranslator(boldItalicUnicodeInitialization));
    translatorList.push(new asciiToUnicodeTranslator(cursiveUnicodeInitialization));

    // write HTML to create thwir respective output fields
    translatorList.forEach(function(translator, index, array){
      $("#outputPanel").append(translator.writeHTML());
    });
  }

  // need to initilize before adding event handlers for output
  initialize();

  // Transpose event handlers
  $("#inputText").keyup(transpose);

    // Google Analytics Events
  $("#inputText").click(function(){
    gtag('event','click',{
      'event_cataegory':'translate_input',
      'event_label':$(this).attr("id")
    });
  });

  $(".outputText").on("copy",function(){
    gtag('event','click',{
      'event_cataegory':'translate_output',
      'event_label':$(this).attr("id")
    });
  });
});
