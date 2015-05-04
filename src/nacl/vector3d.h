#ifndef _VECTOR3D_H
#define _VECTOR3D_H

#define VECADD(a, b)\
  a[0] += b[0], a[1] += b[1], a[2] += b[2], a
#define VECSUB(a, b)\
  a[0] -= b[0], a[1] -= b[1], a[2] -= b[2], a
#define VECMUL(a, b)\
  a[0] *= b[0], a[1] *= b[1], a[2] *= b[2], a
#define VECDIV(a, b)\
  a[0] /= b[0], a[1] /= b[1], a[2] /= b[2], a

#define VECADDF(a, b)\
  a[0] += b, a[1] += b, a[2] += b, a
#define VECSUBF(a, b)\
  a[0] -= b, a[1] -= b, a[2] -= b, a
#define VECMULF(a, b)\
  a[0] *= b, a[1] *= b, a[2] *= b, a
#define VECDIVF(a, b)\
  a[0] /= b, a[1] /= b, a[2] /= b, a


#define VECDOT(a, b)\
  (a[0]*b[0] + a[1]*b[1] + a[2]*b[2])

#define VECLEN(a)\
  sqrt(VECDOT(a, a))

#define VECDIST(a, b)\
  sqrt((a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]) + (a[2]-b[2])*(a[2]-b[2]))

#define NORMALIZE(a)\
  { float _l = 1.0/VECLEN(a); VECMULF(a, _l);}

#define VECCOPY(a, b)\
  a[0] = b[0], a[1] = b[1], a[2] = b[2]

static void VECROT2D(double vec[3], double angle)
{
    angle += M_PI*0.5;
    double x  = vec[0], y = vec[1];

    vec[0] = sin(angle)*x + cos(angle)*y;
    vec[1] = sin(angle)*y - cos(angle)*x;

    return;
}
#endif /* _VECTOR3D_H */
