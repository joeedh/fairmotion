#include <math.h>
#include <float.h>
#include <string.h>

#include "vector3d.h"
#include <time.h>

#include "solver.h"
#include "wasm_api.h"

int solver_debug = 0;

double time_ms() {
  return ((double)clock() / (double)CLOCKS_PER_SEC)*1000.0;
}

double eval_constraint(
            Constraint *con, SplineSegment *ss, 
            SplineVertex *vs)
{
  
  switch (con->type) {
    case TAN_CONSTRAINT:
      {
        double tan1[3], tan2[3];
        double s1 = -0.5 + 1.0*con->param1f;
        double s2 = -0.5 + 1.0*con->param2f;
        
        SplineSegment *seg1 = ss + con->param1;
        SplineSegment *seg2 = ss + con->param2;
        
        SplineVertex  *v1   = vs + seg1->v1;
        SplineVertex  *v2   = vs + seg1->v2;
        SplineVertex  *v3   = vs + seg2->v1;
        SplineVertex  *v4   = vs + seg2->v2;
        
        eval_curve_dv(tan1, s1, v1->co, v2->co, seg1->ks, ORDER, false, true);
        eval_curve_dv(tan2, s2, v3->co, v4->co, seg2->ks, ORDER, false, true);
        
        //logf("ks1: %.4lf %.4lf %.4lf %.4lf %.4lf %.4lf", seg1->ks[0], seg1->ks[1],  
        //     seg1->ks[2], seg1->ks[3], seg1->ks[4], seg1->ks[5]);
        //logf("ks2: %.4lf %.4lf %.4lf %.4lf %.4lf %.4lf", seg2->ks[0], seg2->ks[1],  
        //     seg2->ks[2], seg2->ks[3], seg2->ks[4], seg2->ks[5]);
        
        //logf("seg1 len: %.4f, v1: %d, v2: %d", VECDIST(v1->co, v2->co), seg1->v1, seg1->v2);
        //logf("seg2 len: %.4f, v1: %d, v2: %d", VECDIST(v3->co, v4->co), seg2->v1, seg2->v2);
        
        if (s1 == s2) {
          VECMULF(tan1, -1.0);
        }
        
        //NORMALIZE(tan1);
        //NORMALIZE(tan2);
        
        double dot = VECDOT(tan1, tan2);
        
        //logf("tan1: %.4lf %.4lf %.4lf", tan1[0], tan1[1], tan1[2]);
        //logf("tan2: %.4lf %.4lf %.4lf", tan2[0], tan2[1], tan2[2]);
        //logf("dot:  %.4lf\n", dot);
        
        if (isnan(dot)) {
          return 0.0;
        }
        
        if (dot < -1.0) dot = -1.0;
        if (dot > 1.0) dot = 1.0;
        
        return acos(dot);
      }
      
      break;

#ifndef SPOWER_K
    //note that this is a hard constraint
    case CURVATURE_CONSTRAINT:
    { //*
        int s1 = (ORDER-1)*con->param1f;
        int s2 = (ORDER-1)*con->param2f;  
        //double tan1[3], tan2[3];
        
        SplineSegment *seg1 = ss + con->param1;
        SplineSegment *seg2 = ss + con->param2;
        
        /*
        SplineVertex  *v1   = vs + seg1->v1;
        SplineVertex  *v2   = vs + seg1->v2;
        SplineVertex  *v3   = vs + seg2->v1;
        SplineVertex  *v4   = vs + seg2->v2;
        
        //ensure segments are updated?
        eval_curve_dv(tan1, s1, v1->co, v2->co, seg1->ks, ORDER, false, true);
        eval_curve_dv(tan2, s2, v3->co, v4->co, seg2->ks, ORDER, false, true);
       //*/
        
        double scale1 = seg1->ks[KSCALE], scale2 = seg2->ks[KSCALE];
        
        double k1 = seg1->ks[s1] / (scale1 != 0.0 ? scale1 : 10000.0);
        double k2 = seg2->ks[s2] / (scale2 != 0.0 ? scale2 : 10000.0);
        
        if (s1 == s2) {
          k1 *= -1.0;
        }
        
        double k = (k1+k2)*0.5;
        
        if (!(seg1->flag & FIXED_KS))
          seg1->ks[s1] = k*seg1->ks[KSCALE]*(s1 == s2 ? -1.0 : 1.0);
          
        if (!(seg2->flag & FIXED_KS))
          seg2->ks[s2] = k*seg2->ks[KSCALE];
        
        //*/
        //this is a hard constraint
        return 0;
      }
      
      break;
#else //SPOWER_K
    //note that this is not a newton-raphson constraint 
    case CURVATURE_CONSTRAINT:
    { //*
        int s1 = (ORDER-1)*con->param1f;
        int s2 = (ORDER-1)*con->param2f;  
        //double tan1[3], tan2[3];
        
        SplineSegment *seg1 = ss + con->param1;
        SplineSegment *seg2 = ss + con->param2;
        
        /*
        SplineVertex  *v1   = vs + seg1->v1;
        SplineVertex  *v2   = vs + seg1->v2;
        SplineVertex  *v3   = vs + seg2->v1;
        SplineVertex  *v4   = vs + seg2->v2;
        
        //ensure segments are updated?
        eval_curve_dv(tan1, s1, v1->co, v2->co, seg1->ks, ORDER, false, true);
        eval_curve_dv(tan2, s2, v3->co, v4->co, seg2->ks, ORDER, false, true);
       //*/
        
        double ksign = s1 == s2 ? -1.0 : 1.0;
        double ratio=0.0;
        if (seg1->ks[KSCALE] == 0.0 || seg2->ks[KSCALE] == 0.0) {
          ratio = 0.5;
        } else {
          ratio = seg1->ks[KSCALE] / (seg2->ks[KSCALE] != 0.0 ? seg2->ks[KSCALE] : 10000.0);
        }
        
        if (ratio > 1.0)
          ratio = 1.0 / ratio;
        
        double mulfac = ratio*0.5;
        double ret = 0.0;
        double scale1 = seg1->ks[KSCALE];
        double scale2 = seg2->ks[KSCALE];
        
        for (int i=0; i<ORDER/2; i++) {
          s1 = !con->param1f ? i : ORDER-1-i;
          s2 = !con->param2f ? i : ORDER-1-i;
          
          double k1 = seg1->ks[s1] / (scale1 != 0.0 ? scale1 : 1.0);
          double k2 = ksign*seg2->ks[s2] / (scale2 != 0.0 ? scale2 : 1.0);
          
          double k = (k1+k2)*0.5;
          
          ret += fabs(k1-k)*0.5 + fabs(k2-k)*0.5;
          
          if (!(seg1->flag & FIXED_KS))
            k1 = k*seg1->ks[KSCALE];
          else
            k1 *= seg1->ks[KSCALE];
            
          if (!(seg2->flag & FIXED_KS))
            k2 = k*ksign*seg2->ks[KSCALE];
          else
            k2 *= seg2->ks[KSCALE]*ksign;
            
          seg1->ks[s1] += (k1 - seg1->ks[s1])*mulfac;
          seg2->ks[s2] += (k2 - seg2->ks[s2])*mulfac;
        }
        
        return ret;
      }
      
      break;
#endif
    case COPY_C_CONSTRAINT: //non-newton-raphson constraint
    {
      SplineSegment *seg = ss + con->seg1;
      
      int vi = con->param1;
      double fac = 0.0;
      
      if (!vi) {
        seg->ks[0] += (seg->ks[ORDER-1] - seg->ks[0])*fac;
      } else {
        seg->ks[ORDER-1] += (seg->ks[0] - seg->ks[ORDER-1])*fac;
      }
      
      return 0.0;
    }
    
    case HARD_TAN_CONSTRAINT:
    {
      SplineSegment *seg = ss + con->seg1;
      SplineVertex *v1 = vs + seg->v1;
      SplineVertex *v2 = vs + seg->v2;
      
      double th = con->param1f, s = (con->param2f-0.5)*(1.0-0.0000001);
      double tan[3];
      
      eval_curve_dv(tan, s, v1->co, v2->co, seg->ks, ORDER, false, true);
      
      double th2 = atan2(tan[0], tan[1]);
      
      th2 = acos(sin(th2)*sin(th) + cos(th2)*cos(th));
      
      return th2;
    }
    break;
  }
  
  return 0.0;
}

#define CLAMP_R(r) (r < 0.001 ? 0.0 : r)

#define STEPS 35
#define DF 0.000003

int solve_intern(
    SplineVertex *vs, int totvert, SplineSegment *ss, 
    int totseg, Constraint *cs, int totcons) 
{
  Constraint *con = cs;
  double gs[32] = {0.0};
  
  double error = 0.0;

  double start_time = time_ms();
  
  if (totcons == 0)
    return 0;
  
  int si;
  for (si=0; si<STEPS; si++) {
    if (si > 0 && error/(double)totcons < 0.0001) 
      break;
    
    error = 0.0;
    
    for (int i=0; i<totcons; i++) {
      con = cs + (si%2 ? totcons-i-1 : i);
      
      //logf("seg1: %d, seg2: %d, type: %d", con->seg1, con->seg2, con->type);
      
      //need to implement other constraints than tangent first
      if (con->seg1 == -1 && con->type != 1) {
        logf("ERROR! %d, %d %d", con->type, con->seg1, con->seg2);
      }
      
      if (con->seg1 == -1) {
        continue;
      }
      
      double r = eval_constraint(con, ss, vs);
      double clampr = CLAMP_R(r);
      
      error += r;
      
      if (isnan(r) || clampr < 0.0)
        continue;
      
      for (int sj=0; sj<2; sj++) {
        int segi = sj ? con->seg2 : con->seg1;
        if (segi < 0) {
          for (int j=0; j<16; j++) {
            gs[16*sj+j] = 0.0;
          }
          
          continue;
        }
        
        SplineSegment *s = ss + segi;
        
        if (s->flag & FIXED_KS) {
          //logf("fixed ks! %d", s->eid);
          continue;
        }
        
        //calculate gradients. . .
        for (int j=0; j<ORDER; j++) {
          double orig = s->ks[j];
          
          s->ks[j] += DF;
          double r2 = eval_constraint(con, ss, vs);
          //r2 = CLAMP_R(r2);
          s->ks[j] = orig;
          
          if (isnan(r2)) {
            gs[16*sj+j] = 0.0;
            continue;
          }
          
          gs[16*sj+j] = (r2-r)/DF;
        }
      }
      
      double ck = si > 10 ? (double)con->k2 : (double)con->k;
      //logf("con k: %.3f", ck);
        
      for (int sj=0; sj<2; sj++) {
        int segi = sj ? con->seg2 : con->seg1;
        
        if (segi < 0)
          continue;
        
        double totg = 0.0;
        for (int j=0; j<ORDER; j++) {
          totg += gs[16*sj+j]*gs[16*sj+j];
        }
        
        if (totg == 0.0)
          continue;
        
        SplineSegment *s = ss + segi;
        
        if (s->flag & FIXED_KS)
          continue;
        
        double rmul = r / totg;
        
        if (con->type == CURVATURE_CONSTRAINT || 
            con->type == COPY_C_CONSTRAINT)
          continue;
          
        //ignore ws weights for now
        for (int j=0; j<ORDER; j++) {
          s->ks[j] += -rmul*gs[16*sj+j]*ck;
        }
      }
    }
  }
  
  if (solver_debug)
    logf("steps: %d, final error: %.6lf, time: %.2lfms", si+1, error, time_ms() - start_time);
  
  return error;
}

//make sure to free result afterwards
char *do_solve(char *data, int *len_out, bool *free_ret) {
  char *start = data;
  //double start_time = time_ms();
  
  SplineVertex *vs;
  SplineSegment *ss;
  Constraint *cs;
  
  //logf("  - sizeof(vert): %d", sizeof(SplineVertex));
  //logf("  - sizeof(seg): %d", sizeof(SplineSegment));
  //logf("  - sizeof(con): %d", sizeof(Constraint));
  
  data += 8; //skip past message type/id header
  
  int totvert = *(int*)data;
  if (solver_debug)
    logf(" totvert: %d", totvert);
  
  data += 8; //skip past totvert and pad int 
  
  vs = (SplineVertex*) data;
  
  data += sizeof(SplineVertex)*totvert;
  
  int totseg = *(int*)data;
  if (solver_debug)
    logf(" totseg: %d", totseg);
    
  data += 8;
  
  ss = (SplineSegment*) data;
  data += sizeof(SplineSegment)*totseg;
  
  int totcons = *(int*)data;
  if (solver_debug)
    logf(" totcons: %d", totcons);
    
  data += 8;
  
  cs = (Constraint*) data;
  data += sizeof(Constraint)*totcons;
  
  if (solver_debug)
    logf("  data read: %d", (int)(data-start));
  
  *len_out = (int)(data - start);
  *free_ret = false;
  
  double blah[3], ks[16];
  float bleh[3];
  eval_curve(blah, 0.0, bleh, bleh, ks, ORDER, false, false);
  
  solve_intern(vs, totvert, ss, totseg, cs, totcons);
  
  //logf("time2: %.2lfms", time_ms()-start_time);
  
  return start; //reuse original block of data
}

void do_segment_split(SplineDrawSegment *seg, SplineBezSegments *bz) {
  double s=-0.5, ds = 1.0/((double)BEZ_SEGMENTS-1);
  double lastco[3], lastdv[3], co[3], dv[3];
  double *out = (double*) bz->segments;

  bz->eid = seg->eid;
  bz->totseg = BEZ_SEGMENTS;

  for (int i=0; i<BEZ_SEGMENTS+1; i++, s += ds) {
    double st=s+0.5, s2=st*st, s3=s2*st;

    //double k1 = seg->ks[0], k2 = seg->ks[1], k3 = seg->ks[2], k4 = seg->ks[3];
    double k1 = seg->ks[0], dv1_k1 = seg->ks[1], dv1_k2 = seg->ks[2], k2 = seg->ks[3];
    double th = POLYTHETA_BEZ((s+0.5));

    eval_curve(co, s, seg->v1, seg->v2, seg->ks, ORDER, false, false);

    dv[0] = sin(th+seg->ks[KANGLE])*seg->ks[KSCALE];
    dv[1] = cos(th+seg->ks[KANGLE])*seg->ks[KSCALE];

    VECMULF(dv, 1.0/(3.0*BEZ_SEGMENTS));

    if (i > 0) {
      *out++ = lastco[0];
      *out++ = lastco[1];
      *out++ = lastco[0]+lastdv[0];
      *out++ = lastco[1]+lastdv[1];

      *out++ = co[0];
      *out++ = co[1];
      *out++ = co[0]-dv[0];
      *out++ = co[1]-dv[1];
    }

    VECCOPY(lastco, co);
    VECCOPY(lastdv, dv);
  }
}
