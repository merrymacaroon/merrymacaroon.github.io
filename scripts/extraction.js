// Copyright © 2019 merrymacaroon.com All Rights Reserved.

$(document).ready(function(){


  // brewControlCanvasClass manages drawing of brew parameters on
  // a brew control chart
  class brewControlCanvasClass {
    constructor (initializers) {
      this.windowStart = initializers.windowStart; // lower left limit
      this.windowEnd = initializers.windowEnd; // upper right limit
      this.canvasId = initializers.canvasId;

      this.ctx = $(this.canvasId)[0].getContext("2d");

      this.canvasHeight = Math.round($(this.canvasId).height());
      $(this.canvasId).attr("height",this.canvasHeight);

      this.canvasWidth = Math.round($(this.canvasId).width());
      $(this.canvasId).attr("width",this.canvasWidth);
    }

    // maps extraction to canvas x position
    mapX (inputX) {
        return ((inputX - this.windowStart.x) /
          (this.windowEnd.x - this.windowStart.x))*this.canvasWidth;
    }

    // maps TDS to canvas y position
    mapY (inputY) {
        return (1-(inputY - this.windowStart.y) /
          (this.windowEnd.y - this.windowStart.y))*this.canvasHeight;
    }

    // maps canvas x position to extraction
    unmapX (inputX) {
        return inputX * (this.windowEnd.x - this.windowStart.x) /
          this.canvasWidth + this.windowStart.x;
    }

    // maps canvas y position to TDS
    unmapY (inputY) {
        return (1 - inputY / this.canvasHeight) *
          (this.windowEnd.y - this.windowStart.y) + this.windowStart.y;
    }

    drawGrid(intervalX, intervalY) {
      var x;
      var y;

      this.ctx.beginPath();
      this.ctx.font = "15px sans-serif";
      this.ctx.strokeStyle = "#000000";
      this.ctx.fillStyle = "#000000";
      this.ctx.lineWidth = 1;

      var i = 0;
      for (y = this.windowStart.y; y < this.windowEnd.y; y += intervalY) {
        this.ctx.moveTo(0, this.mapY(y));
        this.ctx.lineTo(this.canvasWidth, this.mapY(y));
        this.ctx.stroke();
        if (i) {
          // don't label first grid line
          this.ctx.fillText(y.toFixed(2), 0, this.mapY(y));
        }
        i++;
      }

      i = 0;
      for (x = this.windowStart.x; x < this.windowEnd.x; x += intervalX) {
        this.ctx.moveTo(this.mapX(x), 0);
        this.ctx.lineTo(this.mapX(x), this.canvasHeight );
        this.ctx.stroke();
        if (i) {
          // don't label first grid line
          this.ctx.fillText(x, this.mapX(x), this.canvasHeight);
        }
        i++;
      }
    }

    drawBox (lowerLeft, upperRight) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = "#00FF00";
      this.ctx.lineWidth = 5;
      this.ctx.rect(
        this.mapX(lowerLeft.x), // top left x
        this.mapY(upperRight.y), // top left y
        this.mapX(upperRight.x) - this.mapX(lowerLeft.x), // width
        this.mapY(lowerLeft.y) - this.mapY(upperRight.y) // height (flipped)
      );
      this.ctx.stroke();
    }

    drawRatios (start, end, interval, LRR) {
      var pixelRatio = window.devicePixelRatio;


      this.ctx.beginPath();
      this.ctx.strokeStyle = "#FF0000";
      this.ctx.lineWidth = 2;

      this.ctx.font = "15px sans-serif";


      this.ctx.fillStyle = "#FF0000";


      for (var ratio = start; ratio <= end; ratio += interval) {
        // this.ctx.beginPath();
        // this.ctx.strokeStyle = "#FF0000";
        // this.ctx.lineWidth = 2;
        this.ctx.moveTo(
          this.mapX(brewControlClass.calcExtraction(this.windowStart.y, ratio, LRR)),
          this.mapY(this.windowStart.y));
        this.ctx.lineTo(
          this.mapX(brewControlClass.calcExtraction(this.windowEnd.y, ratio, LRR)),
          this.mapY(this.windowEnd.y));
        this.ctx.stroke();

        var textPositionX = this.mapX(brewControlClass.calcExtraction(this.windowEnd.y, ratio, LRR));
        var textPositionY;
        if (textPositionX < this.canvasWidth) {
          textPositionX -= 40;
          textPositionY = this.mapY(this.windowEnd.y) + 20;
        } else {
          textPositionX = this.mapX(this.windowEnd.x) - 40;
          textPositionY = this.mapY(brewControlClass.calcTDS(this.windowEnd.x, ratio, LRR)) + 30;
        }


        this.ctx.fillText(
          ratio.toFixed(1),
          textPositionX,
          textPositionY
        );

      }
    }

    drawTargetPoint(point) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = "#00FF00";
      this.ctx.lineWidth = 4;
      this.ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
      this.ctx.stroke();

      var target = {
        "extraction" : this.unmapX(point.x),
        "TDS" : this.unmapY(point.y),
      };
      return target;
    }

    drawTarget(extr, TDS) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = "#00FF00";
      this.ctx.lineWidth = 4;
      this.ctx.arc(this.mapX(extr), this.mapY(TDS), 10, 0, 2 * Math.PI);
      this.ctx.stroke();
    }
    drawMeasured(extr, TDS) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = "#0000FF";
      this.ctx.lineWidth = 2;
      this.ctx.arc(this.mapX(extr), this.mapY(TDS), 5, 0, 2 * Math.PI);
      this.ctx.stroke();
    }

    clearCanvas(){
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    resizeCanvas(){
      var pixelRatio = window.devicePixelRatio;

      var canvasHeight = (parseInt($(this.canvasId).css("height"))*pixelRatio);
      this.canvasHeight = ($(this.canvasId).height());
      $(this.canvasId).attr("height",this.canvasHeight);

      var canvasWidth = (parseInt($(this.canvasId).css("width"))*pixelRatio);
      this.canvasWidth = ($(this.canvasId).width());
      $(this.canvasId).attr("width",this.canvasWidth);

    }
  }

  // brewControlClass manages brew parameters
  class brewControlClass {

    constructor(initializers) {
      this.state = {};
      this.state.actualTDS = initializers.TDS;
      this.state.actualExtraction = initializers.extraction;
      this.state.brewWater = 0;
      this.state.bevWeight = 0;
      this.state.actualBevWeight = 0;
      this.state.actualCoffeeDose = initializers.coffeeDose;

      this.state.extraction = initializers.extraction;
      this.state.TDS = initializers.TDS;
      this.state.LRR = initializers.LRR;
      this.state.coffeeDose = initializers.coffeeDose;

      this.setBrewWater(this.calcBrewWater(), false);
    }
    getState(){
      return this.state;
    }

    
    calcExtraction(){
      // E = C/(1-C/100)*(W/D - LRR)
      // return this.state.TDS/(1-this.state.TDS/100) *
      //   (this.state.brewWater/this.state.coffeeDose - this.state.LRR);
      return brewControlClass.calcExtraction(
        this.state.TDS,
        this.state.brewWater /
        this.state.coffeeDose,
        this.state.LRR);
    }
    static calcExtraction(TDS, Ratio, LRR){
      return TDS/(1-TDS/100) *
        (Ratio - LRR);
    }
    static calcTDS(extraction, Ratio, LRR){
      return 100 * extraction/
        ((Ratio - LRR)*100 + extraction);
    }
    calcActualExtraction(){
      // E = C/(1-C/100)*(BEVm/D)
      return this.state.actualTDS/(1-this.state.actualTDS/100) *
        (this.state.actualBevWeight/this.state.actualCoffeeDose);
    }
    calcBevWeight() {
      return this.state.brewWater - this.state.LRR*this.state.coffeeDose;
    }
    calcBrewWater() {
      // W = (E*(1-C/100)/C + LRR)*D
      return (this.state.extraction * (1 - this.state.TDS/100)/this.state.TDS +
        this.state.LRR) * this.state.coffeeDose;
    }
    calcCoffeeDose(){
      //D = W / (E*(1-C/100)/C + LRR)
      return this.state.brewWater / (this.state.extraction *
        (1 - this.state.TDS/100) / this.state.TDS + this.state.LRR);
    }
    calcLRR() {
      return (this.state.brewWater - this.state.actualBevWeight) /
        this.state.coffeeDose;
    }

    getRatio(){
      return this.state.brewWater/this.state.coffeeDose;
    }

    // set during planning
    setLRR(LRR, directSet) {
      if (this.state.LRR != LRR) {
        this.state.LRR = LRR;
        // this.state.bevWeight = this.calcBevWeight()
        if (directSet) {
          this.setBrewWater(this.calcBrewWater(), false);
        }
      }
    }
    // set during planning
    setTDS(TDS){
      if (this.state.TDS != TDS) {
        this.state.TDS = this.state.actualTDS = TDS;
        this.setBrewWater(this.calcBrewWater(), false);
      }
    }
    // set during planning
    setExtraction(extr) {
      if (this.state.extraction != extr) {
        this.state.actualExtraction = this.state.extraction = extr;
        this.setBrewWater(this.calcBrewWater(), false);
      }
    }
    // set during planning or calculated
    setCoffeeDose(dose, directSet) {
      if (this.state.coffeeDose != dose) {
        this.state.coffeeDose = this.state.actualCoffeeDose = dose;
        if (directSet) {
          this.setBrewWater(this.calcBrewWater(), false);
        }
      }
    }
    // set during planning or calculated
    setBrewWater(bw, directSet) {
      if (this.state.brewWater != bw) {
        // only update if there are changes
        this.state.brewWater = bw;
        this.state.actualBevWeight = this.state.bevWeight = this.calcBevWeight();
        if (directSet) {
          this.setCoffeeDose(this.calcCoffeeDose(), false);
        }
      }
    }

    // set during review
    setactualBevWeight(bev) {
//      if (this.state.actualBevWeight != bev) {
        this.state.actualBevWeight = bev;
        // this.setLRR(this.calcLRR, false);
        this.state.actualExtraction = this.calcActualExtraction();
  //    }
    }
    // set during review
    setactualCoffeeDose(D) {
      if (this.state.actualCoffeeDose != D) {
        this.state.actualCoffeeDose = D;
        // this.setLRR(this.calcLRR, false);
        this.state.actualExtraction = this.calcActualExtraction();
      }
    }
    // set during review
    setactualTDS(TDS){
      if (this.state.actualTDS != TDS) {
        this.state.actualTDS = TDS;
        this.state.actualExtraction = this.calcActualExtraction();
      }
    }
  }

  // initBrewControl = {
  //   "LRR" : 2.1,
  //   "TDS" : 1.3,
  //   "extraction" : 20,
  //   "coffeeDose" : 15,
  // };
  // theBrewControl = new brewControlClass(initBrewControl);
  //
  // initCanvas = {
  //   "windowStart" : {"x" : 13, "y" : 1},
  //   "windowEnd" : {"x" : 26, "y" : 1.65},
  //   "canvasId" : "#canvas",
  // };
  //
  // theCanvas = new brewControlCanvasClass(initCanvas);

  function repaintCanvas(){
    theCanvas.clearCanvas();
    theCanvas.drawGrid(1, 0.05);
    greenBoxStart = {
      "x" : 18, "y" : 1.2
    };
    greenBoxEnd = {
      "x" : 22, "y" : 1.45
    };
    theCanvas.drawBox(greenBoxStart, greenBoxEnd);
    //theCanvas.drawRatios(13, 19, 1);
    theCanvas.drawRatios(
      theBrewControl.getRatio(),
      theBrewControl.getRatio(),
      1,
      theBrewControl.state.LRR);
    theCanvas.drawTarget(theBrewControl.state.extraction, theBrewControl.state.TDS);
    theCanvas.drawMeasured(theBrewControl.state.actualExtraction,
        theBrewControl.state.actualTDS);
  }

  function updatePlanForm() {
//    $("#extraction input").val(theBrewControl.state.extraction.toFixed(1));
//    $("#TDS input").val(theBrewControl.state.TDS.toFixed(2));

    var state = theBrewControl.getState();

    $("#extraction input").val(state.extraction.toFixed(1));
    $("#TDS input").val(state.TDS.toFixed(2));
    $("#coffeeDose input").val(state.coffeeDose.toFixed(1));
    $("#brewWater input").val(state.brewWater.toFixed(1));
    $("#LRR input").val(state.LRR.toFixed(1));
    $("#bev input").val(state.bevWeight.toFixed(1));


    $("#actualCoffeeDose input").val(state.coffeeDose.toFixed(1));
    $("#actualBrewWater input").val(state.brewWater.toFixed(1));
    $("#actualLRR input").val(state.LRR.toFixed(1));
    $("#actualExtraction input").val(state.actualExtraction.toFixed(1));
    $("#actualBev input").val(state.actualBevWeight.toFixed(1));
  }

  function updateActualForm() {
    var state = theBrewControl.getState();
    $("#actualTDS input").val(state.actualTDS.toFixed(2));
    $("#actualBev input").val(state.actualBevWeight.toFixed(1));
    $("#actualExtraction input").val(state.actualExtraction.toFixed(1));
    // var TDS = parseFloat($("#actualTDS input").val());
    // var Ratio = parseFloat($("#actualBrewWater input").val()) /
    //   parseFloat($("#actualCoffeeDose input").val());
    // var LRR = parseFloat($("#actualLRR input").val());
    //
    // var extr = brewControlClass.calcExtraction(TDS, Ratio, LRR);
    // $("#actualLRR input").val(extr);
  }

  function touchEvent(event) {

    var offset = $('#canvas').offset();
    var touchObject = event.changedTouches[0];
    //var pixelRatio = window.devicePixelRatio;
    var pixelRatio = 1;


    var point = {
      "x" : (touchObject.pageX - offset.left) * pixelRatio,
      "y" : (touchObject.pageY - offset.top)*pixelRatio,
    };

    var target = theCanvas.drawTargetPoint(point);
    theBrewControl.setTDS(target.TDS);
    theBrewControl.setExtraction(target.extraction);

    repaintCanvas();
    updatePlanForm();

  }
  function mouseEvent(event) {
    // var pixelRatio = window.devicePixelRatio;
    var pixelRatio = 1;

    point = {
      "x" : event.offsetX * pixelRatio,
      "y" : event.offsetY * pixelRatio,
    };
    // theCanvas.clearCanvas();
    // theCanvas.drawGrid(1, 0.05);
    // theCanvas.drawBox(greenBoxStart, greenBoxEnd);
    // theCanvas.drawRatios(
    //   theBrewControl.getRatio(),
    //   theBrewControl.getRatio(),
    //   1,
    //   theBrewControl.state.LRR);
    //
    var target = theCanvas.drawTargetPoint(point);
    theBrewControl.setTDS(target.TDS);
    theBrewControl.setExtraction(target.extraction);

    repaintCanvas();
    updatePlanForm();

  }

  $("#canvas").on("touchstart", function(event){
    // check for weird CSS width change when Chrome inspector is open
    if ( theCanvas.canvasWidth != $("#canvas").width()) {
        theCanvas.resizeCanvas();
        repaintCanvas();
    }
    event.preventDefault();
    touchEvent(event);
  });

  $("#canvas").on("touchmove", function(event){
    event.preventDefault();
    touchEvent(event);
  });

  $("#canvas").mousedown(function(event){
    event.preventDefault();
    // check for weird CSS width change when Chrome inspector is open
    if ( theCanvas.canvasWidth != $("#canvas").width()) {
        theCanvas.resizeCanvas();
        repaintCanvas();
    }

    mouseEvent(event);

    $("#canvas").on("mousemove", function(event){
      event.preventDefault();
      mouseEvent(event);
    });
  });

  $("#canvas").mouseup(function(){
    event.preventDefault();
    $("#canvas").off("mousemove");
  });

  $(window).resize(function(){
    theCanvas.resizeCanvas();
    repaintCanvas();
  });

  $("#TDS input").focusout(function(){
    var TDS = parseFloat($("#TDS input").val());
    theBrewControl.setTDS(TDS);
    repaintCanvas();
    updatePlanForm();
    updateActualForm();
  });
  $("#extraction input").focusout(function(){
    theBrewControl.setExtraction(parseFloat($("#extraction input").val()));
    repaintCanvas();
    updatePlanForm();
    updateActualForm();
  });
  $("#coffeeDose input").focusout(function(){
    var D = parseFloat($("#coffeeDose input").val());
    theBrewControl.setCoffeeDose(D, true);
    repaintCanvas();
    updatePlanForm();
    updateActualForm();
  });
  $("#brewWater input").focusout(function(){
    theBrewControl.setBrewWater(parseFloat($("#brewWater input").val()), true);
    repaintCanvas();
    updatePlanForm();
    updateActualForm();
  });
  $("#LRR input").focusout(function(){
    theBrewControl.setLRR(parseFloat($("#LRR input").val()), true);
    repaintCanvas();
    updatePlanForm();
    updateActualForm();
  });

  $("#actualTDS input").focusout(function(){
    theBrewControl.setactualTDS(parseFloat($("#actualTDS input").val()));
    repaintCanvas();
    updateActualForm();
  });
  $("#actualCoffeeDose input").focusout(function(){
    theBrewControl.setactualCoffeeDose(parseFloat($("#actualCoffeeDose input").val()));
    repaintCanvas();
    updateActualForm();
  });
  $("#actualBrewWater input").focusout(function(){
    var bev = parseFloat($("#actualBrewWater input").val()) -
      parseFloat($("#actualLRR input").val()) *
      parseFloat($("#actualCoffeeDose input").val()
    );
    theBrewControl.setactualBevWeight(bev);
    repaintCanvas();
    updateActualForm();
  });
  $("#actualLRR input").focusout(function(){
    var bev = parseFloat($("#actualBrewWater input").val()) -
      parseFloat($("#actualLRR input").val()) *
      parseFloat($("#actualCoffeeDose input").val()
    );
    theBrewControl.setactualBevWeight(bev);
    repaintCanvas();
    updateActualForm();
  });

  initBrewControl = {
    "LRR" : 2.1,
    "TDS" : 1.3,
    "extraction" : 20,
    "coffeeDose" : 15,
  };
  var theBrewControl = new brewControlClass(initBrewControl);

  initCanvas = {
    "windowStart" : {"x" : 13, "y" : 1},
    "windowEnd" : {"x" : 26, "y" : 1.65},
    "canvasId" : "#canvas",
  };

  theCanvas = new brewControlCanvasClass(initCanvas);
  repaintCanvas();
  updatePlanForm();
  $("#bev input").attr("readonly", true);
  $("#bev input").css("background-color", "lightgrey");
  $("#actualExtraction input").attr("readonly", true);
  $("#actualExtraction input").css("background-color", "lightgrey");

});
