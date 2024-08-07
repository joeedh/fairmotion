/*
on factor;
operator theta;

forall s,k1,k2,k3,k4,thstart let theta(s,k1,k2,k3,k4,thstart) = thstart+(((((3*s-4)*k3-6*(s-2)*k4)*s+(3*s*s-8*s+6)*k2)*s+6*(s*s*s-2*s*s+2)*k1)*s)/12;
dx1 := sin(theta(s1, a1, a2, a3, a4, th1));
dy1 := cos(theta(s1, a1, a2, a3, a4, th1));
dx2 := sin(theta(s2, b1, b2, b3, b4, th2));
dy2 := cos(theta(s2, b1, b2, b3, b4, th2));

fres := acos(dx1*dx2 + dy1*dy2);

on fort;
da1 := df(fres, a1);
da2 := df(fres, a2);
da3 := df(fres, a3);
da4 := df(fres, a4);

db1 := df(fres, b1);
db2 := df(fres, b2);
db3 := df(fres, b3);
db4 := df(fres, b4);
off fort;
*/

let tangent = `
12:  da1 := df(fres, a1);
      ans2=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)*sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0))*(s1**3-2.0*s1**2+2.0)*s1
      ans1=sqrt(-(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0))**2+1.0)*ans2
      ans4=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-1.0)
      ans3=2.0*(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**
     . 2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1
     . )/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2
     . -8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)
     . /12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)+1.0)*ans4
      da1=ans1/ans3

78: da2 := df(fres, a2);
      ans2=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)*sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0))*(3.0*s1**2-8.0*s1+6.0)*s1**2
      ans1=sqrt(-(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0))**2+1.0)*ans2
      ans4=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-1.0)
      ans3=12.0*(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+1.0)*ans4
      da2=ans1/ans3

79: da3 := df(fres, a3);
      ans2=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)*sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0))*(3.0*s1-4.0)*s1**3
      ans1=sqrt(-(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0))**2+1.0)*ans2
      ans4=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-1.0)
      ans3=12.0*(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+1.0)*ans4
      da3=ans1/ans3

80: da4 := df(fres, a4);
      ans3=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)*sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0))*(s1-2.0)*s1**3
      ans2=sqrt(-(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0))**2+1.0)*ans3
      ans1=-ans2
      ans5=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-1.0)
      ans4=2.0*(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**
     . 2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1
     . )/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2
     . -8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)
     . /12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)+1.0)*ans5
      da4=ans1/ans4

81: db1 := df(fres, b1);
      ans3=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)*sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0))*(s2**3-2.0*s2**2+2.0)*s2
      ans2=sqrt(-(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0))**2+1.0)*ans3
      ans1=-ans2
      ans5=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-1.0)
      ans4=2.0*(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**
     . 2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1
     . )/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2
     . -8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)
     . /12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)+1.0)*ans5
      db1=ans1/ans4

82: db2 := df(fres, b2);
      ans3=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)*sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0))*(3.0*s2**2-8.0*s2+6.0)*s2**2
      ans2=sqrt(-(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0))**2+1.0)*ans3
      ans1=-ans2
      ans5=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-1.0)
      ans4=12.0*(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+1.0)*ans5
      db2=ans1/ans4

83: db3 := df(fres, b3);
      ans3=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)*sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0))*(3.0*s2-4.0)*s2**3
      ans2=sqrt(-(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0))**2+1.0)*ans3
      ans1=-ans2
      ans5=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-1.0)
      ans4=12.0*(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+1.0)*ans5
      db3=ans1/ans4

84: db4 := df(fres, b4);
      ans2=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)*sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0))*(s2-2.0)*s2**3
      ans1=sqrt(-(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1
     . **2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*
     . th1)/12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2
     . **2-8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*
     . th2)/12.0))**2+1.0)*ans2
      ans4=(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)-1.0)
      ans3=2.0*(cos((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**
     . 2-8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1
     . )/12.0)*cos((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2
     . -8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)
     . /12.0)+sin((((((3.0*s1-4.0)*a3-6.0*(s1-2.0)*a4)*s1+(3.0*s1**2-
     . 8.0*s1+6.0)*a2)*s1+6.0*(s1**3-2.0*s1**2+2.0)*a1)*s1+12.0*th1)/
     . 12.0)*sin((((((3.0*s2-4.0)*b3-6.0*(s2-2.0)*b4)*s2+(3.0*s2**2-
     . 8.0*s2+6.0)*b2)*s2+6.0*(s2**3-2.0*s2**2+2.0)*b1)*s2+12.0*th2)/
     . 12.0)+1.0)*ans4
      db4=ans1/ans3

`;

function generate(code, name, out, maxgs) {
  function transform(code, substrs) {
    code = code.replace(/\r/g, "");

    let lines = code.split("\n");
    let exprs = [""];

    for (let l of lines) {
      if (!l.trim().startsWith(".")) {
        exprs.push(l.trim());
      } else {
        l = l.trim();
        l = l.slice(1, l.length);
        exprs[exprs.length - 1] += l;
      }
    }

    function otherbracket(s, i) {
      let t = 0

      while (i < s.length) {
        if (s[i] === "(") {
          t++;
        } else if (s[i] === ")") {
          t--;
          if (t <= 0) {
            return i;
          }
        }

        i++;
      }
    }

    function otherbracket_back(s, i) {
      let t = 0

      while (i >= 0) {
        if (s[i] === "(") {
          t--;

          if (t <= 0) {
            return i;
          }
        } else if (s[i] === ")") {
          t++;
        }

        i--;
      }
    }

    function escape(s) {
      let s2 = "";

      for (let i = 0; i < s.length; i++) {
        let c = s[i];

        if (c.match(/[\\|\^\.\-\+\[\]\(\)\{\}*?/]/)) {
          s2 += "\\";
        }

        s2 += c;
      }

      return s2;
    }

    let exprs2 = [];

    for (let i = 0; i < exprs.length; i++) {
      let expr = exprs[i];

      expr = expr.replace(/[ \t\n\r]/g, "");
      expr = expr.replace(/s(\d)\*\*(\d)/g, "s$1$2");

      let expr2 = expr;

      expr2 = expr;
      while (1) {
        si = expr2.search(/cos|sin/);

        if (si < 0) {
          exprs[i] = expr2;
          break;
        }

        si += 3

        let si2 = otherbracket(expr2, si);

        let substr = expr2.slice(si + 1, si2);
        substrs.add(substr);

        expr2 = expr2.slice(si2, expr.length);
      }

      let j = 0;
      for (let substr of substrs) {
        substr = escape(substr);
        let re = new RegExp(substr, "g");
        //console.log(substr);
        let cname = "c" + j;
        expr = expr.replace(re, cname)

        expr = expr.replace(/cos\(c\d+\)/g, cname + "cos");
        expr = expr.replace(/sin\(c\d+\)/g, cname + "sin");
        j++;
      }

      let expr3 = "";
      expr2 = expr;

      for (let j = 0; j < 100; j++) {
        let si = expr2.search(/\)\*\*/);

        if (si >= 0) {
          let start = otherbracket_back(expr2, si);
          let end = si;

          expr3 += expr2.slice(0, start);

          let match = expr2.slice(start, end);
          let pw = expr2[end + 3];

          //expr2 = expr2.slice(si+4, expr2.length);

          expr2 = `pow${match}, ${pw}.0)` + expr2.slice(end + 4, expr2.length);

          console.log(expr3 + expr2, start, end)
          //console.log(expr, si);
        } else {
          expr3 += expr2;
          expr2 = "";
          break;
        }
      }

      expr = expr3 + expr2;

      expr = expr.trim();
      if (expr.length === 0) {
        continue;
      }

      exprs2.push(expr)
    }

    return exprs2;
  }

  code = code.replace(/\d+\:.*\n/g, "LINE");
  code = code.split("LINE");
  let substrs = new Set();
  let chunks = [];

  for (let chunk of code) {
    chunks.push(transform(chunk, substrs));
  }

  out += `\n
static void ${name}(double s1, double *ks1, double s2, double *ks2, double *gs) {
  double a1 = ks1[0], a2 = ks1[1], a3 = ks1[2], a4 = ks1[3];
  double b1 = ks2[0], b2 = ks2[1], b3 = ks2[2], b4 = ks2[3];
  double th1 = ks1[KANGLE], th2 = ks2[KANGLE];
 
`;

  let j = 0;
  out += `  double s12=s1*s1, s13=s12*s1;\n`;
  out += `  double s22=s2*s2, s23=s22*s2;\n`;
  for (let s of substrs) {
    out += `  double c${j} = ${s};\n`
    out += `  double c${j}sin = sin(c${j});\n`;
    out += `  double c${j}cos = cos(c${j});\n`;
    j++;
  }

  let scope = new Set();

  let gi = -1;

  for (let chunk of chunks) {
    for (let expr of chunk) {
      expr = expr.trim();

      out += "  ";

      let vname = expr.split("=")[0];
      if (!scope.has(vname)) {
        scope.add(vname);
        out += "double ";
      }

      out += expr + ";\n";

      if (vname.startsWith("d")) {
        out += `  gs[${gi}] = ${vname};\n`;
      }
    }
    gi++;

    out += "\n";

    if (maxgs !== undefined && gi >= maxgs) {
      break;
    }
    //out += eq + "\n";
  }
  out += "}\n\n"

  console.log(out);
  return out;
}

let out = "//AUTO-GENERATED CODE!\n";

out = generate(tangent, "tangent_dv", out);

require('fs').writeFileSync("constraint_dv.h", out);
