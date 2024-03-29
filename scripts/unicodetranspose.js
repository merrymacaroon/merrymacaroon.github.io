// Copyright © 2019 merrymacaroon.com All Rights Reserved.

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
      this.dictionary = unicodeInitialization.dictionary;
      this.offset = unicodeInitialization.offset;
      this.displayName = unicodeInitialization.displayName;
      this.outputTextID = unicodeInitialization.outputTextID;
    }

    writeHTML() {
      return this.displayName;
    }

    translateCharToUnicode(inputChar) {

      if (inputChar in this.dictionary) {
        return this.dictionary[inputChar];
      } else {
        // use offset
        if (inputChar.charAt(0) >= "A" && inputChar.charAt(0) <= "Z")
          return (inputChar.charCodeAt(0)+this.offset + 6).toString(16);
        else if (inputChar.charAt(0) >= "a" && inputChar.charAt(0) <= "z")
          return (inputChar.charCodeAt(0)+this.offset).toString(16);
        else return inputChar.charAt(0); // fallthrough: return inputText
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
      dictionary : {}
    };
    var boldUnicodeInitialization = {
      offset : (0x1D5D4 - 0x47),
      displayName : "<h1 id='boldFont'><b>Bold</b></h1><p id='boldText' class='outputText'>&nbsp;</p>",
      outputTextID : "#boldText",
      dictionary : {}
    };
    var boldItalicUnicodeInitialization = {
      offset : (0x1D63C - 0x47),
      displayName : "<h1 id='boldItalicFont'><i><b>Bold Italic</b></i></h1><p id='boldItalicText' class='outputText'>&nbsp;</p>",
      outputTextID : "#boldItalicText",
      dictionary : {}
    };
    var cursiveUnicodeInitialization = {
      offset : (0x1D4D0 - 0x47),
      displayName : "<h1 id='cursiveFont'>Cursive</h1><p id='cursiveText' class='outputText'>&nbsp;</p>",
      outputTextID : "#cursiveText",
      dictionary : {}
    };
    var doublestruckUnicodeInitialization = {
      offset : (0x1D538 - 0x47),
      displayName : "<h1 id='doublestruckFont'>Doublestruck</h1><p id='doublestruckText' class='outputText'>&nbsp;</p>",
      outputTextID : "#doublestruckText",
      dictionary : {
        "C" : "2102",
        "H" : "210D",
        "N" : "2115",
        "P" : "2119",
        "Q" : "211A",
        "R" : "211D",
        "Z" : "2124",
        "0" : "1D7D8",
        "1" : "1D7D9",
        "2" : "1D7DA",
        "3" : "1D7DB",
        "4" : "1D7DC",
        "5" : "1D7DD",
        "6" : "1D7DE",
        "7" : "1D7DF",
        "8" : "1D7E0",
        "9" : "1D7E1",
      }
    };

    translatorList.push(new asciiToUnicodeTranslator(italicUnicodeInitialization));
    translatorList.push(new asciiToUnicodeTranslator(boldUnicodeInitialization));
    translatorList.push(new asciiToUnicodeTranslator(boldItalicUnicodeInitialization));
    translatorList.push(new asciiToUnicodeTranslator(cursiveUnicodeInitialization));
    translatorList.push(new asciiToUnicodeTranslator(doublestruckUnicodeInitialization));

    // write HTML to create thwir respective output fields
    translatorList.forEach(function(translator, index, array){
      $("#outputPanel").append(translator.writeHTML());
    });
  }

  // need to initilize before adding event handlers for output
  initialize();

  // Transpose event handlers
  $("#inputText").keyup(transpose);
  $("#inputText").on("paste",function(){
    setTimeout(transpose,0);
  });

    // Google Analytics Events
  $("#inputText").click(function(){
    gtag('event','click',{
      'event_category':'translate_input',
      'event_label':$(this).attr("id")
    });
  });

  $(".outputText").on("copy",function(){
    gtag('event','click',{
      'event_category':'translate_output',
      'event_label':$(this).attr("id")
    });
  });
});
