#!/usr/bin/env python
import cgi
import cgitb
cgitb.enable()

form = cgi.FieldStorage()

import numpy as np
import matplotlib.pyplot as plt

import cStringIO
import sys
import os

import json
import hashlib

dfile = ['/home/daniel/temperature.csv', '/home/daniel/cutting_force.csv']
cachedir = '/home/daniel/pngcache'

format = 'png'

print "Content-Type: text/html\n"

try:
#    print form.keys()
#    print form['
    jsons = form["RSettings"].value
    rs = json.loads(jsons)
    rs = rs["RSettings"]

except (ValueError, AttributeError, KeyError):
    rs = {'dataset':0, 'variable': 1, 'seq': -1, 'grid': 0}
    pass

hash_src = "RSETTINGS:%s:%s:%s:%s" % (rs['dataset'], rs['variable'], rs['seq'], int(rs['grid']))
hdigest = hashlib.sha1(hash_src).hexdigest()

cachefile = os.path.join(cachedir, "%s.png"%hdigest)
if not os.path.exists(cachefile):
    data = np.loadtxt(dfile[rs['dataset']], delimiter=";")
    t = data[:,0]

    idx = rs['variable']
    tdata = data[:,idx]

    sequences = 100
    sequence = rs['seq']
    useseq = True if sequence >= 0 else False

    dlen = len(tdata)
    start = dlen/sequences*sequence
    stop = start+dlen/sequences
    bottom = np.min(tdata)
    top = np.max(tdata)

    if useseq:
        view_data = tdata[start:stop]
        t = t[start:stop]
    else:
        view_data = tdata
    fig_w = 20
    fig_h = 2

    try:
        fig_w = int(form['width'].value)
    except (ValueError, AttributeError, KeyError):
        pass

    try:
        fig_h = int(form['height'].value)
    except (ValueError, AttributeError, KeyError):
        pass


    use_axis=rs['grid']

    fig = plt.figure(tight_layout=False)
    fig.set_size_inches( fig_w, fig_h )
    ax = fig.add_subplot(111)
    ax.set_ylim([bottom, top])
    if not use_axis:
        ax.set_axis_off();

    dcolor = (0.0, 0.0, 0.0, 1.0)

    ax.plot(t, view_data, color=dcolor)
    
    #sio = cStringIO.StringIO()
    ofile = open(cachefile, 'wb')
    fig.savefig( ofile, transparent=True, dpi=100 , format=format)
    ofile.close()


print file(cachefile, "rb").read().encode("base64").strip()

