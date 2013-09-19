var cache_store = {};
var ss = new RSettings();

/*
* Initialize the application, set up spin-edit and colorpicker.
* */
function init_app() {
    $('#d-seq-num').spinit({
        min: 0,
        initValue: 0,
        max: 100,
        callback: function (v) {
            ss.seq = v;
            updateGraph();
        },
        mask: 'Sequence Number' });

    $('#colorpicker').colorpicker().on('changeColor', function (ev) {
        ss.color = ev.color.toRGB();
        playwithme();
    });
}

/*
* Function that empties the element and add an option for every item in arraydata
* each item should have the property "name" set.
* */
function setOptions(element, arraydata) {
    element.empty();
    $.each(arraydata, function (index, value) {
        element.append($('<option>', {
            value: index,
            text: value.name
        }));
    });
}

/*
* Function that changes active dataset to the one with index "id"
* Updates the variables list and sets the variable property of the settings object
* */
function updateVariablesForDataset(id) {
    ss.variable = ss.dataset.variables[0]
    setOptions($("#d-variable"), datasets[id].variables);
}

/*
* Ajax call to the png_generator service. Uses the same hash here as on the server to determine if the requested
* image already is available.
* Only fetches image if not in cache
* */
function updateGraph() {
    var fhash = ss.toHash();
    if (fhash in cache_store) {
        $("#the-graph").attr("src", "data:image/png;base64," + cache_store[fhash]);
        playwithme();
    } else {
        $.post("/cgi-bin/png_generator.py", {RSettings: ss.toJson()}, function (data) {
            $("#the-graph").attr("src", "data:image/png;base64," + data);
            cache_store[fhash] = data;
            playwithme();
        });
    }
}

/*
* Replace the color of the graph with the user specified color.
* Since all chart-data should be cached server side it is not feasible to cache all possible color variations
* The first dataset's has: 2 variables, 100 sequences, 2 options grid or no grid ==> 2*100*2*2 = 800 permutations
* Adding colors to this we have: 800*255*255*255 = 13.26*10^9 so what we try to do is cache black and transparent
* images on the server, deliver them to the client and let the client update the color (using this method)
* */
function playwithme() {
    var image = document.getElementById("the-graph");
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");

    //Make the canvas as large as the src image
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    //Copy image data to canvas keeping src size
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, image.naturalWidth, image.naturalHeight);

    var imgd = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var pix = imgd.data;

    for (var I = 0, L = pix.length; I < L; I += 4) {
        if (pix[I + 3] > 0) {
            pix[I] = ss.color.r;
            pix[I + 1] = ss.color.g;
            pix[I + 2] = ss.color.b;
            //pix[I + 3] = ss.color.a*255;
        }
    }
    ctx.putImageData(imgd, 0, 0);
    //Put the edited image back...
    image.src = canvas.toDataURL("image/png");
}

$(function () {
    init_app();
    setOptions($('#d-dataset'), datasets)
    updateVariablesForDataset(0);


    $('#d-dataset').change(function () {
        var ds_id = $("#d-dataset option:selected").val();
        ss.dataset = datasets[ds_id];
        updateVariablesForDataset(ds_id);
        updateGraph();
    });

    $('#d-variable').change(function () {
        var var_id = $("#d-variable option:selected").val();
        ss.variable = ss.dataset.variables[var_id];
        updateGraph();
    });

    $('#render-settings').submit(function () {
        updateGraph();
        return false;
    });

    $("#d-grid").change(function () {
        ss.grid = this.checked;
        updateGraph();
    });

    $("#d-all-seq").change(function () {
        $("#d-seq-num").toggle(!this.checked);
        ss.toggleSeq(!this.checked)
        updateGraph();
    });
});

