#ifndef _SPLINE_H
#define _SPLINE_H

#include "vector3d.h"

#define SPOWER_K

#define ORDER 4
#define KSCALE (ORDER+1)
#define KANGLE (ORDER+2)
#define KSTARTX (ORDER+3)
#define KSTARTY (ORDER+4)
#define KSTARTZ (ORDER+5)
#define KTOTKS (ORDER+6)

#define INT_STEPS 6
#define BEZ_SEGMENTS  5 //number of beziers used for drawing segments

//normally I would used inlined statics.  however, I already
//had these macros from the JS code

#ifndef SPOWER_K //simple bernstein

#define POLYTHETA_BEZ(s) (-(((3*(s)-4)*k3-k4*(s))*(s)*(s)+((s)*(s)-2*(s)+2)*((s)-2)*k1-(3*(s)*(s)-8*(s)+6)*k2*(s))*(s))*0.25
#define POLYCURVATURE_BEZ(s) (-(((3*((s)-1)*k3-k4*(s))*(s)-3*((s)-1)*((s)-1)*k2)*(s)+((s)-1)*((s)-1)*((s)-1)*k1))
#define POLYCURVATURE_BEZ_DV(s) (-3*(k1*(s)*(s)-2*k1*(s)+k1-3*k2*(s)*(s)+4*k2*(s)-k2+3*k3*(s)*(s)-2*k3*(s)-k4*(s)*(s)))

#elif 0 //berstein with forced zero derivative at endpoints (based on smoothstep)

#define POLYTHETA_BEZ(s) (((((3*(112*s5-560*s4+945*s3-460*s2-280*s+252)*k3-(\
                          112*s3-560*s2+945*s-540)*k4*s2)*s2-3*(112*s7-560*s6+\
                          945*s5-380*s4-560*s3+504*s2+70*s-140)*k2)*s2+(112*\
                          s9-560*s8+945*s7-300*s6-840*s5+756*s4+210*s3-420\
                          *s2+140)*k1)*s)/140)

#define POLYCURVATURE_BEZ(s) ((k1-k2-(k2-k3)*(2*s-3)*s2+(k1-k2)*(2*s-3)*s2-(k2-k3-(k3-\
                               k4)*(2*s-3)*s2+(k2-k3)*(2*s-3)*s2)*(2*s-3)*s2+(k1-k2-(k2\
                               -k3)*(2*s-3)*s2+(k1-k2)*(2*s-3)*s2)*(2*s-3)*s2)*(2*s-3)*\
                               s2+(k1-k2-(k2-k3)*(2*s-3)*s2+(k1-k2)*(2*s-3)*s2)*(2*s-3)\
                               *s2+(k1-k2)*(2*s-3)*s2+k1)

#define POLYCURVATURE_BEZ_DV(s) (18*(4*k1*s6-12*k1*s5+9*k1*s4+4*k1*s3-6*k1*s2+k1-12\
                                  *k2*s6+36*k2*s5-27*k2*s4-8*k2*s3+12*k2*s2-k2+12*k3*s6\
                                  -36*k3*s5+27*k3*s4+4*k3*s3-6*k3*s2-4*k4*s6+12*k4*\
                                  s5-9*k4*s4)*(s-1)*s)
#elif defined(SPOWER_K)

#define POLYTHETA_BEZ(s) (((((3*s-4)*dv1_k2-6*(s-2)*k2)*s+(3*s2-8*s+6)*dv1_k1)*s+6\
                          *(s3-2*s2+2)*k1)*s)/12

#define POLYCURVATURE_BEZ(s) (((s-1)*dv1_k1+dv1_k2*s)*(s-1)-(2*s-3)*k2*s)*s+(2*s+1)*(s-1)*(s-1)*k1

#define POLYCURVATURE_BEZ_DV(s) (6*(k1-k2)*(s-1)+(3*s-2)*dv1_k2)*s+(3*s-1)*(s-1)*dv1_k1

#endif

static void approx(double ret[3], double s1, double ks[16], double order) {
  double s=0, ds=s1/(double)INT_STEPS, mul=s1/(double)INT_STEPS;
  double mul2=mul*mul; //, mul3=mul2*mul, mul4=mul3*mul;
  double x = 0, y = 0;
//  double k1 = ks[0], k2 = ks[1], k3 = ks[2], k4 = ks[3];
  double k1 = ks[0], dv1_k1 = ks[1], dv1_k2 = ks[2], k2 = ks[3];

  ret[0] = ret[1] = ret[2] = 0.0;

  for (int i=0; i<INT_STEPS; i++) { 
    double st=s+0.5, s2=st*st, s3=s2*st;

    double th = POLYTHETA_BEZ(st);
    double dx = sin(th), dy = cos(th);

    double kt = POLYCURVATURE_BEZ(st);
    double dkt = POLYCURVATURE_BEZ_DV(st);

    double kt2=kt*kt;

    x += dx + (dy*kt)*mul*0.5 + (dy*dkt - kt2*dx)*mul2*(1.0/6.0);
    y += dy + (-dx*kt)*mul*0.5 + (-(dy*kt2 + dx*dkt))*mul2*(1.0/6.0);

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

  //double k1=ks[0], k2=ks[1], k3=ks[2], k4=ks[3];
  double k1 = ks[0], dv1_k1 = ks[1], dv1_k2 = ks[2], k2 = ks[3];
  double st=s11+0.5, s2=st*st, s3=s2*st;
  double th = POLYTHETA_BEZ(st);
  
  co[0] = sin(th+ks[KANGLE]) * (no_scale ? 1.0 : ks[KSCALE]);
  co[1] = cos(th+ks[KANGLE]) * (no_scale ? 1.0 : ks[KSCALE]);
  co[2] = 0.0;
}

#undef EPS

#endif /* _SPLINE_H */
