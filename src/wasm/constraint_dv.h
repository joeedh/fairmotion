//AUTO-GENERATED CODE!


static void tangent_dv(double s1, double *ks1, double s2, double *ks2, double *gs) {
  double a1 = ks1[0], a2 = ks1[1], a3 = ks1[2], a4 = ks1[3];
  double b1 = ks2[0], b2 = ks2[1], b3 = ks2[2], b4 = ks2[3];
  double th1 = ks1[KANGLE], th2 = ks2[KANGLE];
 
  double s12=s1*s1, s13=s12*s1;
  double s22=s2*s2, s23=s22*s2;
  double c0 = (((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s12-8.0*s1+6.0)*a2)*s1+6.0*(s13-2.0*s12+2.0)*a1)*s1+12.0*th1)/12.0;
  double c0sin = sin(c0);
  double c0cos = cos(c0);
  double c1 = (((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s22-8.0*s2+6.0)*b2)*s2+6.0*(s23-2.0*s22+2.0)*b1)*s2+12.0*th2)/12.0;
  double c1sin = sin(c1);
  double c1cos = cos(c1);

  double ans2=(c0cos*c1sin-c1cos*c0sin)*(s13-2.0*s12+2.0)*s1;
  double ans1=sqrt(-pow(c0cos*c1cos+c0sin*c1sin, 2.0)+1.0)*ans2;
  double ans4=(c0cos*c1cos+c0sin*c1sin-1.0);
  double ans3=2.0*(c0cos*c1cos+c0sin*c1sin+1.0)*ans4;
  double da1=ans1/ans3;
  gs[0] = da1;

  ans2=(c0cos*c1sin-c1cos*c0sin)*(3.0*s12-8.0*s1+6.0)*s12;
  ans1=sqrt(-pow(c0cos*c1cos+c0sin*c1sin, 2.0)+1.0)*ans2;
  ans4=(c0cos*c1cos+c0sin*c1sin-1.0);
  ans3=12.0*(c0cos*c1cos+c0sin*c1sin+1.0)*ans4;
  double da2=ans1/ans3;
  gs[1] = da2;

  ans2=(c0cos*c1sin-c1cos*c0sin)*(3.0*s1-4.0)*s13;
  ans1=sqrt(-pow(c0cos*c1cos+c0sin*c1sin, 2.0)+1.0)*ans2;
  ans4=(c0cos*c1cos+c0sin*c1sin-1.0);
  ans3=12.0*(c0cos*c1cos+c0sin*c1sin+1.0)*ans4;
  double da3=ans1/ans3;
  gs[2] = da3;

  ans3=(c0cos*c1sin-c1cos*c0sin)*(s1-2.0)*s13;
  ans2=sqrt(-pow(c0cos*c1cos+c0sin*c1sin, 2.0)+1.0)*ans3;
  ans1=-ans2;
  double ans5=(c0cos*c1cos+c0sin*c1sin-1.0);
  ans4=2.0*(c0cos*c1cos+c0sin*c1sin+1.0)*ans5;
  double da4=ans1/ans4;
  gs[3] = da4;

  ans3=(c0cos*c1sin-c1cos*c0sin)*(s23-2.0*s22+2.0)*s2;
  ans2=sqrt(-pow(c0cos*c1cos+c0sin*c1sin, 2.0)+1.0)*ans3;
  ans1=-ans2;
  ans5=(c0cos*c1cos+c0sin*c1sin-1.0);
  ans4=2.0*(c0cos*c1cos+c0sin*c1sin+1.0)*ans5;
  double db1=ans1/ans4;
  gs[4] = db1;

  ans3=(c0cos*c1sin-c1cos*c0sin)*(3.0*s22-8.0*s2+6.0)*s22;
  ans2=sqrt(-pow(c0cos*c1cos+c0sin*c1sin, 2.0)+1.0)*ans3;
  ans1=-ans2;
  ans5=(c0cos*c1cos+c0sin*c1sin-1.0);
  ans4=12.0*(c0cos*c1cos+c0sin*c1sin+1.0)*ans5;
  double db2=ans1/ans4;
  gs[5] = db2;

  ans3=(c0cos*c1sin-c1cos*c0sin)*(3.0*s2-4.0)*s23;
  ans2=sqrt(-pow(c0cos*c1cos+c0sin*c1sin, 2.0)+1.0)*ans3;
  ans1=-ans2;
  ans5=(c0cos*c1cos+c0sin*c1sin-1.0);
  ans4=12.0*(c0cos*c1cos+c0sin*c1sin+1.0)*ans5;
  double db3=ans1/ans4;
  gs[6] = db3;

  ans2=(c0cos*c1sin-c1cos*c0sin)*(s2-2.0)*s23;
  ans1=sqrt(-pow(c0cos*c1cos+c0sin*c1sin, 2.0)+1.0)*ans2;
  ans4=(c0cos*c1cos+c0sin*c1sin-1.0);
  ans3=2.0*(c0cos*c1cos+c0sin*c1sin+1.0)*ans4;
  double db4=ans1/ans3;
  gs[7] = db4;

}

