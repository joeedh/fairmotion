#include <math.h>
#include <float.h>
#include <string.h>

#include "vector3d.h"
#include <time.h>

#include "solver.h"
#include "graphics_3d.h"

int solver_debug = 0;

double time_ms() {
  return ((double)clock() / (double)CLOCKS_PER_SEC)*1000.0;
}

double Graphics3DInstance::eval_constraint(
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
        
        if (dot < -1.0) dot = -1.0;
        if (dot > 1.0) dot = 1.0;
        
        return acos(dot);
      }
      
      break;
      
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
        
        double k1 = seg1->ks[s1] / seg1->ks[KSCALE];
        double k2 = seg2->ks[s2] / seg2->ks[KSCALE];
        
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
    case HARD_TAN_CONSTRAINT:
    {
      SplineSegment *seg = ss + con->seg1;
      SplineVertex *v1 = vs + seg->v1;
      SplineVertex *v2 = vs + seg->v2;
      
      double th = con->param1f, s = (con->param2f-0.5)*(1.0-0.0000001);
      double tan[3];
      
      eval_curve_dv(tan, s, v1->co, v2->co, seg->ks, ORDER, false, true);
      
      double th2 = atan2(tan[0], tan[1]);
      
      th2 = fabs(th-th2);
      if (th2 > M_PI) {
        th2 -= M_PI;
      }
      
      return th2;
    }
    break;
  }
  
  return 0.0;
}

#define CLAMP_R(r) (r < 0.001 ? 0.0 : r)

#define STEPS 70
#define DF 0.000003

int Graphics3DInstance::solve_intern(
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
    if (si > 0 && error/(double)totcons < 0.001) 
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
char *Graphics3DInstance::do_solve(char *data, int *len_out, bool *free_ret) {
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