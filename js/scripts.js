var cache_store = {};
var ss = new RSettings();

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

function setOptions(selector, arraydata) {
    var el = $(selector);
    el.empty();
    $.each(arraydata, function (index, value) {
        el.append($('<option>', {
            value: index,
            text: value.name
        }));
    });
}

function updateVariablesForDataset(id) {
    //sel_variable = sel_dataset.variables[0];
    ss.variable = ss.dataset.variables[0]
    setOptions("#d-variable", datasets[id].variables);
}

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
        if (pix[I + 3] > 0) // If it's not a transparent pixel, modify
        {
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
    setOptions("#d-dataset", datasets)
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

