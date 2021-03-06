var datasets = [
    {name: "Gear Milling", variables: [
        {name: "Temperature", id: 1}
    ], id: 0},
    {name: "Drilling", variables: [
        {name: "Force X", id: 1},
        {name: "Force Y", id: 2},
        {name: "Force Z", id: 3}
    ], id: 1},
    {name: "Milling", variables: [
        {name: "Force X", id: 1},
        {name: "Force Y", id: 2},
        {name: "Force Z", id: 3}
    ], id: 2},
    {name: "Drilling 2", variables: [
	{name: "Force 1", id: 1},
        {name: "Force 2", id: 2},
        {name: "Force 3", id: 3},
	{name: "Force 4", id: 4}
     ], id: 3}

];

function RSettings(dataset, variable, color, grid, seq) {
    this.dataset = dataset;
    this.variable = variable;
    this.color = color;
    this.grid = grid;
    this.seq = seq;
    this.tmp_seq = seq;

    this.dataset = typeof this.dataset !== 'undefined' ? this.dataset : datasets[0];
    this.variable = typeof this.variable !== 'undefined' ? this.variable : datasets[0].variables[0];
    this.color = typeof this.color !== 'undefined' ? this.color : {"r": 0, "g": 0, "b": 0};
    this.grid = typeof this.grid !== 'undefined' ? this.grid : false;
    this.seq = typeof this.seq !== 'undefined' ? this.seq : -1;
};

/*
* Generate JSON-representation of parameters.
* */
RSettings.prototype.toJson = function () {
    return JSON.stringify(this.getParams());
}

/*
* Pick the parameters relevant for the server side
* */
RSettings.prototype.getParams = function () {
    var dto = { RSettings: {
        dataset: this.dataset.id,
        variable: this.variable.id,
        grid: this.grid,
        seq: this.seq
    }};
    return dto;
}

/*
* Hash the string containing same things as the server-side python script hashes
* */
RSettings.prototype.toHash = function () {
    var src = "RSETTINGS:" + this.dataset.id + ":" + this.variable.id + ":" + this.seq + ":" + Number(this.grid);
    return Sha1.hash(src);
}

/*
* Keep the sequence number when toggled to whole sequence and back
* */
RSettings.prototype.toggleSeq = function (enabled) {
    if (!enabled) {
        this.tmp_seq = this.seq;
        this.seq = -1;
    } else {
        this.seq = this.tmp_seq;
    }
}
