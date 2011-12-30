#!/bin/sh

FULLWIDTH=32768
FULLHEIGHT=16384
if [ $FULLWIDTH -gt $FULLHEIGHT ]; then
  FULLSIZE=$FULLWIDTH
else
  FULLSIZE=$FULLHEIGHT
fi

TILESIZE=512
MINLEVEL=6
MAXLEVEL=$(echo "lev=l($FULLSIZE)/l(2); scale=0; (lev + .9999) / 1" |bc -l)

if [ -d $MAXLEVEL ]; then
  for LEVEL in `seq $((MAXLEVEL-1)) -1 $MINLEVEL`; do
    PREVLEVEL=$(($LEVEL+1))
    SCALEDWIDTH=$(echo "scale=0; $FULLWIDTH / 2^($MAXLEVEL - $LEVEL)" |bc -l)
    SCALEDHEIGHT=$(echo "scale=0; $FULLHEIGHT / 2^($MAXLEVEL - $LEVEL)" |bc -l)
    WIDTH=$(echo "scale=0; ($SCALEDWIDTH / $TILESIZE)" |bc -l)
    HEIGHT=$(echo "scale=0; ($SCALEDHEIGHT / $TILESIZE)" |bc -l)
    if [ ! -d $LEVEL ]; then
      mkdir $LEVEL
    fi
    echo
    echo "Level $LEVEL (${WIDTH}x${HEIGHT})"
    for ROW in `seq 0 $(($HEIGHT - 1))`; do
      for COL in `seq 0 $(($WIDTH - 1))`; do
        OUTFILE=$LEVEL/${COL}_${ROW}.png
        if [ ! -e $OUTFILE ]; then
          montage $PREVLEVEL/$(($COL * 2))_$(($ROW * 2)).png $PREVLEVEL/$(($COL * 2 + 1))_$(($ROW * 2)).png $PREVLEVEL/$(($COL * 2))_$(($ROW * 2 + 1)).png $PREVLEVEL/$(($COL * 2 + 1))_$(($ROW * 2 + 1)).png -geometry "$((TILESIZE / 2))x$((TILESIZE / 2))>+0+0" $OUTFILE && echo -n '.' || echo -n '!'
        else
          echo -n o
        fi
      done
      echo
    done
  done
else
  echo "Couldn't find high-detail tile directory ($MAXLEVEL)"
fi

