#!/bin/bash
# Build a fast-cut plate montage in the same style as the Figma one.
#
#   tools/make-clip.sh <recording> <output-name> [detail-x] [detail-y]
#
#   recording    any screen recording (mp4/mov)
#   output-name  e.g. "cursor" -> media/cursor-tools.mp4 + .webp poster
#   detail-x/y   the point to punch in on, in SOURCE pixels (default: centre)
#
# Five beats, ~2.3s, loops: wide push -> punch to detail -> sweep -> whip
# back -> settle wide. The row is only on screen about a second, so the cuts
# are short on purpose.
set -e
SRC="$1"; NAME="$2"
[ -f "$SRC" ] || { echo "no such file: $SRC" >&2; exit 1; }
[ -n "$NAME" ] || { echo "usage: make-clip.sh <recording> <name> [x] [y]" >&2; exit 1; }

read -r IW IH DUR < <(ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height -show_entries format=duration \
  -of csv=p=0:s=x "$SRC" | tr 'x\n' '  ')

# 4:3 centre crop, even dimensions
CW=$(( (IH * 4 / 3) / 2 * 2 )); [ "$CW" -gt "$IW" ] && CW=$(( IW / 2 * 2 ))
CX=$(( (IW - CW) / 2 ))
CROP="crop=$CW:$IH:$CX:0"
DX="${3:-$(( CW / 2 ))}"; DY="${4:-$(( IH / 2 ))}"
S="s=896x672:fps=30"
T=$(python3 -c "print(f'{min(float('$DUR'),8.0):.2f}')")
q() { python3 -c "print(f'{$1:.2f}')"; }

D=/tmp/mkclip.$$; mkdir -p $D
ffmpeg -v error -ss $(q "$T*0.05") -t 0.35 -i "$SRC" -an -vf "$CROP,zoompan=z='1+0.14*on/10':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:$S" -c:v libx264 -crf 20 -pix_fmt yuv420p $D/1.mp4 -y
ffmpeg -v error -ss $(q "$T*0.25") -t 0.60 -i "$SRC" -an -vf "$CROP,zoompan=z='1.6':x='min(max($DX-(iw/zoom)/2,0),iw-iw/zoom)':y='min(max($DY-(ih/zoom)/2,0),ih-ih/zoom)':d=1:$S" -c:v libx264 -crf 20 -pix_fmt yuv420p $D/2.mp4 -y
ffmpeg -v error -ss $(q "$T*0.50") -t 0.55 -i "$SRC" -an -vf "$CROP,zoompan=z='1.55':x='min(max((iw*0.15+iw*0.5*on/16)-(iw/zoom)/2,0),iw-iw/zoom)':y='min(max($DY-(ih/zoom)/2,0),ih-ih/zoom)':d=1:$S" -c:v libx264 -crf 20 -pix_fmt yuv420p $D/3.mp4 -y
ffmpeg -v error -ss $(q "$T*0.72") -t 0.45 -i "$SRC" -an -vf "$CROP,zoompan=z='1.55-0.5*on/13':x='min(max($DX-(iw/zoom)/2,0),iw-iw/zoom)':y='min(max($DY-(ih/zoom)/2,0),ih-ih/zoom)':d=1:$S" -c:v libx264 -crf 20 -pix_fmt yuv420p $D/4.mp4 -y
ffmpeg -v error -ss $(q "$T*0.10") -t 0.35 -i "$SRC" -an -vf "$CROP,zoompan=z='1.18-0.16*on/10':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:$S" -c:v libx264 -crf 20 -pix_fmt yuv420p $D/5.mp4 -y

for i in 1 2 3 4 5; do printf "file '%s/%s.mp4'\n" "$D" $i; done > $D/list.txt
ffmpeg -v error -f concat -safe 0 -i $D/list.txt -c copy "media/$NAME-tools.mp4" -y
ffmpeg -v error -ss 0.05 -i "media/$NAME-tools.mp4" -frames:v 1 -vf scale=448:-1 $D/poster.png -y
cwebp -q 78 $D/poster.png -o "media/$NAME-tools.webp" >/dev/null 2>&1 || true
rm -rf $D
echo "media/$NAME-tools.mp4  $(du -h "media/$NAME-tools.mp4" | cut -f1)"
