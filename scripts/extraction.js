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
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);

      this.canvasHeight = $(this.canvasId).height();
      $(this.canvasId).attr("height",this.canvasHeight);

      this.canvasWidth = $(this.canvasId).width();
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


      for (y = this.windowStart.y; y < this.windowEnd.y; y += intervalY) {
        this.ctx.moveTo(0, this.mapY(y));
        this.ctx.lineTo(this.canvasWidth, this.mapY(y));
        this.ctx.stroke();
        this.ctx.fillText(y.toFixed(2), 0, this.mapY(y)); // hardcode decmial places for now
      }
      for (x = this.windowStart.x; x < this.windowEnd.x; x += intervalX) {
        this.ctx.moveTo(this.mapX(x), 0);
        this.ctx.lineTo(this.mapX(x), this.canvasHeight );
        this.ctx.stroke();
        this.ctx.fillText(x, this.mapX(x), this.canvasHeight);
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

    clearCanvas(){
      // this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    resizeCanvas(){
      this.canvasHeight = Math.floor($(this.canvasId).height());
      $(this.canvasId).attr("height",this.canvasHeight);

      this.canvasWidth = Math.floor($(this.canvasId).width());
      $(this.canvasId).attr("width",this.canvasWidth);
    }
  }

  // brewControlClass manages brew parameters
  class brewControlClass {

    constructor(initializers) {
      this.state = {};
      this.state.actualTDS = 0;
      this.state.actualExtraction = 0;
      this.state.brewWater = 0;
      this.state.bevWeight = 0;
      this.state.actualBevWeight = 0;

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
      return this.state.TDS/(1-this.state.TDS/100) *
        (this.state.actualBevWeight/this.state.coffeeDose);
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
        this.state.TDS = TDS;
        this.setBrewWater(this.calcBrewWater(), false);
      }
    }
    // set during planning
    setExtraction(extr) {
      if (this.state.extraction != extr) {
        this.state.extraction = extr;
        this.setBrewWater(this.calcBrewWater(), false);
      }
    }
    // set during planning or calculated
    setCoffeeDose(dose, directSet) {
      if (this.state.coffeeDose != dose) {
        this.state.coffeeDose = dose;
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
      if (this.state.actualBevWeight != bev) {
        this.state.actualBevWeight = bev;
        this.setLRR(this.calcLRR, false);
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
  }

  function updateForm() {
//    $("#extraction input").val(theBrewControl.state.extraction.toFixed(1));
//    $("#TDS input").val(theBrewControl.state.TDS.toFixed(2));

    var state = theBrewControl.getState();

    $("#extraction input").val(state.extraction.toFixed(1));
    $("#TDS input").val(state.TDS.toFixed(2));
    $("#coffeeDose input").val(state.coffeeDose.toFixed(1));
    $("#brewWater input").val(state.brewWater.toFixed(1));
    $("#LRR input").val(state.LRR.toFixed(1));
    $("#bev input").val(state.bevWeight.toFixed(1));

  }



  function touchEvent(event) {

    var offset = $('#canvas').offset();
    var touchObject = event.changedTouches[0];

    var point = {
      "x" : touchObject.pageX - offset.left,
      "y" : touchObject.pageY - offset.top,
    };

    var target = theCanvas.drawTargetPoint(point);
    theBrewControl.setTDS(target.TDS);
    theBrewControl.setExtraction(target.extraction);

    repaintCanvas();
    updateForm();

  }
  function mouseEvent(event) {
    point = {
      "x" : event.offsetX,
      "y" : event.offsetY,
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
    updateForm();

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
    theBrewControl.setTDS(parseFloat($("#TDS input").val()));
    repaintCanvas();
    updateForm();
  });
  $("#extraction input").focusout(function(){
    theBrewControl.setExtraction(parseFloat($("#extraction input").val()));
    repaintCanvas();
    updateForm();
  });
  $("#coffeeDose input").focusout(function(){
    theBrewControl.setCoffeeDose(parseFloat($("#coffeeDose input").val()), true);
    repaintCanvas();
    updateForm();
  });
  $("#brewWater input").focusout(function(){
    theBrewControl.setBrewWater(parseFloat($("#brewWater input").val()), true);
    repaintCanvas();
    updateForm();
  });
  $("#LRR input").focusout(function(){
    theBrewControl.setLRR(parseFloat($("#LRR input").val()), true);
    repaintCanvas();
    updateForm();
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
  updateForm();
  $("#bev input").attr("readonly", true);
  $("#bev input").css("background-color", "lightgrey");

});