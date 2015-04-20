#Installing and running the alpha version
## Requirements:
  1. Python [www.python.org](www.python.org)

Download and extract fairmotion_alpha.zip.  Go into the fairmotion_alpha folder,
and (if on windows and python is installed) click run.py, or (if unix) run:

    python run.py
    
Next, open a web browser (preferably Google Chrome), and navigate to http://localhost

#Intro

Fairmotion is an advanced vector graphics/animation editor, written in HTML5 and ES6.

<div style="float: right">
<img align="right" src="https://github.com/joeedh/fairmotion/blob/master/examples/example2.png"></img>
</div>

It is based on the principle of never, ever (ever!) using polynomials for
visual curves. Instead, it integrates a transendental polynomial
spiral, kindof like Raph Levien's Spiro curves:

http://www.levien.com/phd/phd.html

Intead of interpolating x and y separately with two polynomials, 
*one* polynomial (a cubic bezier) is used to define a plane
curve's *curvature function.*  This is then reverse integrated
to get a much nicer looking curve than you would get from stuff like
Bezier curves or B-Splines.

Fairmotion is very much a work in progress, and should be considered pre-alpha.

![Another Example](https://github.com/joeedh/fairmotion/blob/master/examples/example1.png)

##To set up build system##

    cd tools/utils/libs
    tar -xzvf ply-3.4.tar.gz (or use favorite archive tool, e.g. 7zip)
    cd py-3.4
    python setup.py install

###Build parse tables###
From root folder:

    cd tools/extjs_cc
    python js_cc.py

You should see something like:

    js_cc.py: error: too few arguments

###Build source files###
From root folder:

    python js_build.py
  
Note that if inkscaped is installed, the build process
will attempt to render an SVG iconsheet (see src/datafiles/iconsheet.svg).
The build system treats iconsheet.svg as any other source file, and will
detect changes to it.  I've not tested this on linux for a long time,
though, so I'm not sure if it still works there.

##To configure the server:##
  1. Copy pyserver/config_local.py.example to pyserver/config_local.py
  2. Edit contents and set server root, host, doc path, files path (where user files will go), etc.
  
##To run python/sqlite stand-alone server:##

    cd pyserver
    python serv_simple.py

serv_simple.py will create an SQLite database on its first run (it will print the tables
as it makes them).

###Default username/password###
The default username is "user", with no password.

###MySQL & WSGI/Apache###
Fairmotion also supports using WSGI/Apache and MySQL.  Setting that up is a bit more complicated;
there is no db creation code for MySQL, other than a simple SQL script (pyserver/fairmotion.sql).
