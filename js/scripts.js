var datasets = [
    {name:"Gear Milling", variables: [{name:"Temperature", id:1}], id: 0},
    {name:"Drilling", variables: [{name:"Force X", id:1},{name:"Force Y", id:2},{name:"Force Z", id:3}], id:1}
  ];

var sel_dataset;
var sel_variable;
var sel_color = {"r":0,"g":0,"b":0,"a":1};
var sel_grid = false;
var sel_seq = 0;
var sel_seq_tmp = 0;

var cache_store = {};
  
function RSettings(dataset, variable, color, grid, seq){
  this.dataset = dataset;
  this.variable = variable;
  this.color = color;
  this.grid = grid;
  this.seq = seq;
  
  this.dataset = typeof this.dataset !== 'undefined' ? this.dataset : 0;
  this.variable = typeof this.variable !== 'undefined' ? this.variable : 1;
  this.color = typeof this.color !== 'undefined' ? this.color : {"r":0,"g":0,"b":0,"a":1};
  this.grid = typeof this.grid !== 'undefined' ? this.grid : true;
  this.seq = typeof this.seq !== 'undefined' ? this.seq : -1;
};

RSettings.prototype.toJson = function() {
    return JSON.stringify(this.getParams());
}

RSettings.prototype.getParams = function() {
    var dto = { RSettings: {
	dataset: this.dataset,
	variable: this.variable,
	color: this.color,
	grid: this.grid,
	seq: this.seq
    }};
    return dto;
}

RSettings.prototype.toHash = function() {
    var src = "RSETTINGS:"+this.dataset+":"+this.variable+":"+this.seq+":"+Number(this.grid);
    return Sha1.hash(src);
}

var img;

$(function() {
  $('#colorpicker').colorpicker().on('changeColor', function(ev){
    sel_color = ev.color.toRGB();
      playwithme();
  });
  
  //Load some options...
  $.each(datasets, function (index, value) {
    $('#d-dataset').append($('<option>', { 
        value: index,
        text : value.name 
    }));
  });
  $.each(datasets[0].variables, function (index, value) {
    $('#d-variable').append($('<option>', { 
        value: index,
        text : value.name 
    }));
  });
  sel_dataset = datasets[0];
  sel_variable = datasets[0].variables[0];
  
  $('#d-dataset').change( function(){
    sel_dataset = datasets[$( "#d-dataset option:selected" ).val()];
    sel_variable = sel_dataset.variables[0];
    $('#d-variable').empty();
    $.each(sel_dataset.variables, function (index, value) {
      $('#d-variable').append($('<option>', { 
          value: index,
          text : value.name 
      }));
    });
      updateGraph();
  });

  $('#d-variable').change( function(){
    sel_variable = sel_dataset.variables[$( "#d-variable option:selected" ).val()];
      updateGraph();
  });

    function playwithme() {
	var image = document.getElementById("the-graph");
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");

	//Make the canvas as large as the src image
	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;
    
	//Copy image data to canvas keeping src size
	ctx.drawImage(image,0,0, image.naturalWidth, image.naturalHeight, 0,0, image.naturalWidth, image.naturalHeight);
    
	var imgd = ctx.getImageData(0, 0, canvas.width, canvas.height);
	var pix = imgd.data;

	for(var I = 0, L = pix.length; I < L; I += 4)
	{
            if(pix[I + 3] > 0) // If it's not a transparent pixel, modify
            {
		pix[I] = sel_color.r;
		pix[I + 1] = sel_color.g;
		pix[I + 2] = sel_color.b;
		//pix[I + 3] = sel_color.a*255;
            }
	}
	ctx.putImageData(imgd, 0, 0);
	//Put the edited image back...
	image.src = canvas.toDataURL("image/png");
  }

    function updateGraph(){
	var s = new RSettings(sel_dataset.id, sel_variable.id, sel_color, sel_grid, sel_seq );
	var dsend = s.getParams();
	var fhash = s.toHash();
	if (fhash in cache_store) {
            $("#the-graph").attr("src", "data:image/png;base64,"+cache_store[fhash]);
            playwithme();
	} else {
	    $.post("/cgi-bin/png_generator.py", {RSettings: s.toJson()}, function(data){
		//console.log(data);
		$("#the-graph").attr("src", "data:image/png;base64,"+data);
		cache_store[fhash] = data;
		playwithme();
	    } );
	}

    }  

  $('#render-settings').submit(function() {
      updateGraph();
      return false;
  });

  $("#d-grid").change(function() {
    sel_grid = this.checked;
      updateGraph();
  });
  
  $("#d-all-seq").change(function() {
    sel_usesequence = this.checked;
    if (!sel_usesequence) {
      $("#d-seq").show();
      sel_seq = sel_seq_tmp;
    } else {
      $("#d-seq").hide();
      sel_seq_tmp = sel_seq;
      sel_seq = -1;
    }
      updateGraph();
  });

  $("#d-seq").on( "sliderchange", function(e,result){
    var v = Math.floor(result.value);
    sel_seq = v;
      updateGraph();
  });

});
