#!/usr/bin/env python
import cgi
import cgitb

import numpy as np
import matplotlib.pyplot as plt
import os

import json
import hashlib

class RSettings(object):
    def __init__(self, cachedir='/tmp', datafiles=[]):
        self._rs = {'dataset':0, 'variable': 1, 'seq': -1, 'grid': 0}
        self._cachedir = cachedir
        self._datafiles = datafiles
    def parseJson(self, jsons):
        """
        Parses json data into the settings object.
        Fallback to default values if failed
        :param data:
        """
        try:
            rs = json.loads(jsons)
            self._rs.update(rs["RSettings"])
        except (ValueError, AttributeError, KeyError):
            pass

    def getHash(self):
        hash_src = "RSETTINGS:%s:%s:%s:%s" % (self._rs['dataset'],
                                              self._rs['variable'],
                                              self._rs['seq'],
                                              int(self._rs['grid']))
        return hashlib.sha1(hash_src).hexdigest()

    def getCacheFilename(self):
        return os.path.join(self._cachedir, "%s.png"% self.getHash())

    def getDataFile(self):
        return self._datafiles[self._rs['dataset']]

    def getVariableId(self):
        return self._rs['variable']

    def useSequence(self):
        return self._rs['seq'] > -1

    def getSequence(self):
        return self._rs['seq']

    def useGrid(self):
        return self._rs['grid']

def getDataView(settings, xdata, ydata, sequenceparts=100):
    if not settings.useSequence():
        return xdata, ydata
    else:
        dlen = len(ydata)
        start = dlen/sequenceparts*settings.getSequence()
        stop = start+dlen/sequenceparts

        return xdata[start:stop], ydata[start:stop]

def main():
    """
    Main routine that uses some hardcoded values to load data from and where to store cache files
    Runs the cgi-service and outputs a png as a result
    """
    dfile = ['/home/daniel/temperature.csv', '/home/daniel/cutting_force.csv']
    cachedir = '/home/daniel/pngcache'

    cgitb.enable()
    form = cgi.FieldStorage()

    s = RSettings(cachedir, dfile)
    s.parseJson(form["RSettings"].value)


    if not os.path.exists(s.getCacheFilename()):
        data = np.loadtxt(s.getDataFile(), delimiter=";")
        xdata = data[:,0]
        ydata = data[:,s.getVariableId()]

        bottom = np.min(ydata)
        top = np.max(ydata)

        viewx, viewy = getDataView(s, xdata, ydata)

        fig_w = 20
        fig_h = 2

        #TODO: Add these as settings in the RSettings class and reflect changes to the hash and the javascript
        #try:
        #    fig_w = int(form['width'].value)
        #except (ValueError, AttributeError, KeyError):
        #    pass

        #try:
        #    fig_h = int(form['height'].value)
        #except (ValueError, AttributeError, KeyError):
        #    pass

        #Set up the figure to plot to
        fig = plt.figure()
        fig.set_size_inches( fig_w, fig_h )
        ax = fig.add_subplot(111)
        ax.set_ylim([bottom, top])

        if not s.useGrid():
            ax.set_axis_off();

        ax.plot(viewx, viewy, 'k-')

        fig.savefig(s.getCacheFilename(), transparent=True, dpi=100 , format="png")

    #Output header and the png data base64 coded
    print "Content-Type: text/html\n"
    print file(s.getCacheFilename(), "rb").read().encode("base64").strip()

main()