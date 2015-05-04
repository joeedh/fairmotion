#ifndef _SPLINE_H
#define _SPLINE_H

#include "vector3d.h"

#define ORDER 4
#define KSCALE (ORDER+1)
#define KANGLE (ORDER+2)
#define KSTARTX (ORDER+3)
#define KSTARTY (ORDER+4)
#define KSTARTZ (ORDER+5)
#define KTOTKS (ORDER+6)

#define INT_STEPS 3
#define BEZ_SEGMENTS  5 //number of beziers used for drawing segments

//normally I would used inlined statics.  however, I already
//had these macros from the JS code

#define POLYTHETA_BEZ(s) (-(((3*(s)-4)*k3-k4*(s))*(s)*(s)+((s)*(s)-2*(s)+2)*((s)-2)*k1-(3*(s)*(s)-8*(s)+6)*k2*(s))*(s))*0.25
#define POLYCURVATURE_BEZ(s) (-(((3*((s)-1)*k3-k4*(s))*(s)-3*((s)-1)*((s)-1)*k2)*(s)+((s)-1)*((s)-1)*((s)-1)*k1))
#define POLYCURVATURE_BEZ_DV(s) (-3*(k1*(s)*(s)-2*k1*(s)+k1-3*k2*(s)*(s)+4*k2*(s)-k2+3*k3*(s)*(s)-2*k3*(s)-k4*(s)*(s)))

static void approx(double ret[3], double s1, double ks[16], double order) {
  double s=0, ds=s1/(double)INT_STEPS, mul=s1/(double)INT_STEPS;
  double mul2=mul*mul; //, mul3=mul2*mul, mul4=mul3*mul;
  double x = 0, y = 0;
  double k1 = ks[0], k2 = ks[1], k3 = ks[2], k4 = ks[3];

  ret[0] = ret[1] = ret[2] = 0.0;

  for (int i=0; i<INT_STEPS; i++) {
    double th = POLYTHETA_BEZ(s+0.5);
    double r1 = sin(th), r2 = cos(th);
    double dx = r1, dy = r2;

    double kt = POLYCURVATURE_BEZ(s+0.5);
    double dkt = POLYCURVATURE_BEZ_DV(s+0.5);

    double kt2=kt*kt;

    x += dx + (r2*kt)*mul*0.5 + (r2*dkt - kt2*r1)*mul2*0.16666666666666;
    y += dy + (-r1*kt)*mul*0.5 + (-(r2*kt2 + r1*dkt))*mul2*0.1666666666666;

    s += ds;
  }

  ret[0] = x*mul;
  ret[1] = y*mul;
  ret[2] = 0.0;
}

#define EPS 0.000001

static void eval_curve(double co[3], double s11, float v1[3], float v2[3], 
                       double ks[16], bool order, bool angle_only, 
                       bool no_update)
{
  double start[3], ang, scale, end[3], vec[3];

  s11 *= 1.0 - EPS;

  if (!no_update) {
    double a1, a2;

    approx(start, -0.5+EPS, ks, order);
    approx(end, 0.5-EPS, ks, order);

    VECSUB(end, start);
    a1 = atan2(end[0], end[1]);

    VECCOPY(vec, v2);
    VECSUB(vec, v1);

    a2 = atan2(vec[0], vec[1]);

    ang = a2-a1;
    scale = VECLEN(vec) / VECLEN(end);

    ks[KSCALE] = scale;
    ks[KANGLE] = ang;
    ks[KSTARTX] = start[0];
    ks[KSTARTY] = start[1];
    ks[KSTARTZ] = start[2];
  } else {
    ang = ks[KANGLE];
    scale = ks[KSCALE];

    start[0] = ks[KSTARTX];
    start[1] = ks[KSTARTY];
    start[2] = ks[KSTARTZ];
  }

  if (!angle_only) {
    approx(co, s11, ks, order);

    VECSUB(co, start);
    VECROT2D(co, -ang);
    VECMULF(co, scale);
    VECADD(co, v1);
  }
}


static void eval_curve_dv(double co[3], double s11, float v1[3], float v2[3], 
                       double ks[16], bool order, bool no_update, bool no_scale)
{
  double start[3], ang, scale, end[3], vec[3];

  s11 *= 1.0 - EPS;

  if (1 || !no_update) {
    double a1, a2;

    approx(start, -0.5+EPS, ks, order);
    approx(end, 0.5-EPS, ks, order);

    VECSUB(end, start);
    a1 = atan2(end[0], end[1]);

    VECCOPY(vec, v2);
    VECSUB(vec, v1);

    a2 = atan2(vec[0], vec[1]);

    ang = a2-a1;
    scale = VECLEN(vec) / VECLEN(end);

    ks[KSCALE] = scale;
    ks[KANGLE] = ang;
    ks[KSTARTX] = start[0];
    ks[KSTARTY] = start[1];
    ks[KSTARTZ] = start[2];
  } else {
    ang = ks[KANGLE];
    scale = ks[KSCALE];

    start[0] = ks[KSTARTX];
    start[1] = ks[KSTARTY];
    start[2] = ks[KSTARTZ];
  }

  double k1=ks[0], k2=ks[1], k3=ks[2], k4=ks[3];
  
  double th = POLYTHETA_BEZ((s11+0.5));
  
  co[0] = sin(th+ks[KANGLE]) * (no_scale ? 1.0 : ks[KSCALE]);
  co[1] = cos(th+ks[KANGLE]) * (no_scale ? 1.0 : ks[KSCALE]);
  co[2] = 0.0;
}

#undef EPS

#endif /* _SPLINE_H */
